-- Sinal (pré-pagamento) manual via Pix.
--
-- Sem gateway, sem webhook, sem conciliação: o cliente paga pela chave Pix da
-- loja, manda o comprovante pelo WhatsApp e a equipe confirma à mão no painel.
-- O banco só guarda o estado e segura o horário por um tempo limitado enquanto
-- o cliente paga.
--
-- Tudo aqui é aditivo. Linhas que já existem ficam com payment_status =
-- 'not_required' (fluxo antigo: pendente -> confirmado pelo painel) e o sinal
-- só liga quando o Lucas preenche valor + chave Pix em Configurações. Com o
-- valor em 0 (padrão) o agendamento se comporta exatamente como antes.
--
-- Ordem de deploy: esta migration vai pro banco ANTES do código novo (o código
-- novo lê as colunas daqui). O contrário não vale. Rollback em
-- supabase/rollbacks/20261002120000_sinal_pix_manual.down.sql.

-- ---------------------------------------------------------------------------
-- business_settings: valor do sinal, chave Pix e tempo de reserva.
-- A chave Pix é exibida ao cliente, então fica na leitura pública da tabela
-- como o resto da linha (não é segredo). deposit_amount = 0 desliga o sinal.
-- ---------------------------------------------------------------------------
alter table public.business_settings
  add column deposit_amount numeric(10, 2) not null default 0
    check (deposit_amount >= 0),
  add column pix_key text,
  add column deposit_hold_minutes integer not null default 15
    check (deposit_hold_minutes between 5 and 240);

-- ---------------------------------------------------------------------------
-- appointments: estado do pagamento do sinal.
--
--   not_required          sem sinal (agendamentos anteriores / sinal desligado)
--   awaiting_payment      horário reservado, cliente ainda vai pagar (expira)
--   awaiting_confirmation cliente diz que pagou; equipe precisa conferir
--   confirmed             equipe conferiu o Pix
--   expired               a reserva venceu sem o cliente avisar que pagou
--
-- O status do agendamento (pending/confirmed/cancelled) continua mandando na
-- agenda e na constraint de conflito. payment_status só descreve o sinal.
-- ---------------------------------------------------------------------------
alter table public.appointments
  add column payment_status text not null default 'not_required'
    check (payment_status in (
      'not_required', 'awaiting_payment', 'awaiting_confirmation',
      'confirmed', 'expired'
    )),
  add column deposit_amount numeric(10, 2) check (deposit_amount > 0),
  add column reservation_expires_at timestamptz,
  add column payment_claimed_at timestamptz,
  add column payment_confirmed_at timestamptz,
  -- e-mail do usuário admin que conferiu o Pix (auditoria simples).
  add column payment_confirmed_by text,
  add constraint appointments_deposit_consistency
    check (payment_status = 'not_required' or deposit_amount is not null);

-- Varredura de reservas vencidas só olha linhas ainda "no relógio".
create index appointments_reservation_expiry_idx
  on public.appointments (reservation_expires_at)
  where status = 'pending' and payment_status = 'awaiting_payment';

-- Fila de conferência do painel.
create index appointments_payment_status_idx
  on public.appointments (payment_status)
  where payment_status in ('awaiting_payment', 'awaiting_confirmation');

-- ---------------------------------------------------------------------------
-- Reserva temporária.
--
-- A constraint appointments_no_overlap ignora só status = 'cancelled', então
-- uma reserva vencida continuaria bloqueando o horário. Como a constraint não
-- pode depender de now(), a reserva vencida é efetivamente cancelada por esta
-- função (payment_status = 'expired' marca que foi por tempo, não pela equipe).
-- Sem cron: é chamada na leitura da disponibilidade, no painel e dentro do
-- trigger de insert abaixo — idempotente e barata (índice parcial).
-- ---------------------------------------------------------------------------
create or replace function public.release_expired_reservations()
returns void
language sql
security definer
set search_path = public
as $$
  update public.appointments
  set status = 'cancelled', payment_status = 'expired'
  where status = 'pending'
    and payment_status = 'awaiting_payment'
    and reservation_expires_at is not null
    and reservation_expires_at < now();
$$;

revoke execute on function public.release_expired_reservations() from public;
grant execute on function public.release_expired_reservations() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Insert público: o valor do sinal e o prazo da reserva vêm sempre das
-- configurações, nunca do que o navegador mandou (anon consegue inserir direto
-- pela API). Também libera reservas vencidas antes do insert pra que elas não
-- gerem um falso conflito de horário.
-- ---------------------------------------------------------------------------
create or replace function public.appointments_apply_deposit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings record;
begin
  perform public.release_expired_reservations();

  new.payment_claimed_at := null;
  new.payment_confirmed_at := null;
  new.payment_confirmed_by := null;

  if new.payment_status = 'awaiting_payment' then
    select deposit_amount, deposit_hold_minutes
      into settings
      from public.business_settings
      limit 1;

    if settings.deposit_amount is null or settings.deposit_amount <= 0 then
      -- Sinal desligado entre o cliente abrir a página e enviar: segue sem sinal.
      new.payment_status := 'not_required';
      new.deposit_amount := null;
      new.reservation_expires_at := null;
    else
      new.deposit_amount := settings.deposit_amount;
      new.reservation_expires_at :=
        now() + make_interval(mins => settings.deposit_hold_minutes);
    end if;
  else
    new.deposit_amount := null;
    new.reservation_expires_at := null;
  end if;

  return new;
end;
$$;

create trigger appointments_apply_deposit
before insert on public.appointments
for each row execute function public.appointments_apply_deposit();

-- anon só cria agendamento pendente e sem pagamento já "confirmado".
drop policy appointments_public_insert on public.appointments;

create policy appointments_public_insert
  on public.appointments for insert
  to anon
  with check (
    status = 'pending'
    and payment_status in ('not_required', 'awaiting_payment')
  );

-- ---------------------------------------------------------------------------
-- Consulta pública de UM agendamento pelo id (UUID aleatório, gerado no
-- servidor e entregue só a quem agendou — funciona como link privado).
-- appointments/clients continuam sem SELECT pra anon; esta função devolve só
-- o recorte que a tela de pagamento precisa, sem telefone nem observações.
-- ---------------------------------------------------------------------------
create or replace function public.get_booking_payment(p_id uuid)
returns table (
  id uuid,
  status text,
  payment_status text,
  starts_at timestamptz,
  ends_at timestamptz,
  deposit_amount numeric,
  reservation_expires_at timestamptz,
  hair_length text,
  client_name text,
  service_name text,
  service_price numeric,
  professional_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.release_expired_reservations();

  return query
  select
    a.id,
    a.status,
    a.payment_status,
    a.starts_at,
    a.ends_at,
    a.deposit_amount,
    a.reservation_expires_at,
    a.hair_length,
    c.name,
    s.name,
    s.price,
    p.name
  from public.appointments a
  join public.clients c on c.id = a.client_id
  join public.services s on s.id = a.service_id
  left join public.professionals p on p.id = a.professional_id
  where a.id = p_id;
end;
$$;

revoke execute on function public.get_booking_payment(uuid) from public;
grant execute on function public.get_booking_payment(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- "Já fiz o Pix": só registra que o cliente iniciou a conferência. NUNCA marca
-- pagamento como confirmado — isso é exclusivo da equipe no painel.
--
-- Devolve o payment_status resultante, ou 'cancelled', 'slot_taken' ou
-- 'not_found'. Se a reserva já venceu mas o horário continua livre, o cliente
-- que pagou atrasado recupera o horário (a constraint barra se outra pessoa
-- pegou nesse meio-tempo).
-- ---------------------------------------------------------------------------
create or replace function public.claim_booking_payment(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  current_payment text;
begin
  update public.appointments
  set payment_status = 'awaiting_confirmation', payment_claimed_at = now()
  where id = p_id
    and status = 'pending'
    and payment_status = 'awaiting_payment';

  if found then
    return 'awaiting_confirmation';
  end if;

  begin
    update public.appointments
    set status = 'pending',
        payment_status = 'awaiting_confirmation',
        payment_claimed_at = now()
    where id = p_id
      and payment_status = 'expired';

    if found then
      return 'awaiting_confirmation';
    end if;
  exception
    when exclusion_violation then
      return 'slot_taken';
  end;

  select a.status, a.payment_status
    into current_status, current_payment
    from public.appointments a
    where a.id = p_id;

  if not found then
    return 'not_found';
  end if;

  if current_status = 'cancelled' then
    return 'cancelled';
  end if;

  return current_payment;
end;
$$;

revoke execute on function public.claim_booking_payment(uuid) from public;
grant execute on function public.claim_booking_payment(uuid) to anon, authenticated;
