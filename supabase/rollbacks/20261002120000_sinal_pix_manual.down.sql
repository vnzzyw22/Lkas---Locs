-- Rollback de supabase/migrations/20261002120000_sinal_pix_manual.sql.
-- Não é aplicado automaticamente pelo `supabase db push` (fica fora de
-- migrations/ de propósito) — rodar à mão no SQL Editor só se for preciso
-- voltar atrás, e só DEPOIS de voltar o código publicado pra versão anterior
-- (o código novo lê as colunas que este arquivo remove).
--
-- ⚠️ Perde o estado do sinal (status do pagamento, valor, data/autor da
-- confirmação) e as configurações de valor/chave Pix/tempo de reserva.
-- ⚠️ Reservas que estavam "aguardando pagamento" voltam a ser agendamentos
-- pendentes comuns (sem prazo); as que expiraram continuam canceladas.

begin;

drop function public.claim_booking_payment(uuid);
drop function public.get_booking_payment(uuid);

drop trigger appointments_apply_deposit on public.appointments;
drop function public.appointments_apply_deposit();
drop function public.release_expired_reservations();

drop policy appointments_public_insert on public.appointments;
create policy appointments_public_insert
  on public.appointments for insert
  to anon
  with check (status = 'pending');

drop index public.appointments_payment_status_idx;
drop index public.appointments_reservation_expiry_idx;

alter table public.appointments
  drop constraint appointments_deposit_consistency,
  drop column payment_confirmed_by,
  drop column payment_confirmed_at,
  drop column payment_claimed_at,
  drop column reservation_expires_at,
  drop column deposit_amount,
  drop column payment_status;

alter table public.business_settings
  drop column deposit_hold_minutes,
  drop column pix_key,
  drop column deposit_amount;

commit;
