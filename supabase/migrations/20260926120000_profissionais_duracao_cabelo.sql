-- Múltiplos profissionais + duração pelo tamanho do cabelo.
--
-- Até aqui o schema assumia 1 profissional por deployment (ver comentários da
-- Fase 1). O Lkas trabalha com vários, então cada agenda passa a ser
-- independente: o conflito de horário vira "mesmo profissional + intervalo
-- sobreposto" em vez de "qualquer intervalo sobreposto".
--
-- Tudo aqui é aditivo e não apaga dado nenhum. Agendamentos antigos são
-- atribuídos ao profissional padrão criado abaixo (era o único que existia).
-- Bloqueios antigos ficam sem profissional = valem pro estúdio inteiro, que é
-- exatamente o que significavam antes. Rollback em
-- supabase/rollbacks/20260926120000_profissionais_duracao_cabelo.down.sql.

-- Necessária pra combinar igualdade (professional_id) e sobreposição de
-- intervalo no mesmo índice GiST da constraint EXCLUDE.
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- professionals
-- ---------------------------------------------------------------------------
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  bio text,
  photo_url text,
  active boolean not null default true,
  display_order integer not null default 0,
  -- Mesmo formato de business_settings.business_hours. null = segue o horário
  -- do estúdio. Quando preenchido, vale a interseção com o horário do estúdio
  -- (o profissional nunca atende com o estúdio fechado).
  working_hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

create index professionals_active_idx on public.professionals (active, display_order);

-- ---------------------------------------------------------------------------
-- professional_services — quais serviços cada profissional realiza.
-- ---------------------------------------------------------------------------
create table public.professional_services (
  professional_id uuid not null references public.professionals (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (professional_id, service_id)
);

create index professional_services_service_idx on public.professional_services (service_id);

-- ---------------------------------------------------------------------------
-- service_hair_durations — serviço + tamanho do cabelo → duração.
-- Serviço sem linhas aqui não pergunta o tamanho e usa services.duration_minutes.
-- ---------------------------------------------------------------------------
create table public.service_hair_durations (
  service_id uuid not null references public.services (id) on delete cascade,
  hair_length text not null check (hair_length in ('short', 'medium', 'long', 'very_long')),
  duration_minutes integer not null check (duration_minutes > 0),
  updated_at timestamptz not null default now(),
  primary key (service_id, hair_length)
);

create trigger set_updated_at
before update on public.service_hair_durations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Equipe inicial + backfill dos dados existentes.
-- Ids fixos pra este passo ser determinístico. Lucas (a001) é o profissional
-- padrão: primeiro na ordem, recebe os agendamentos que já existiam e os
-- inserts legados (trigger abaixo). Todos começam realizando todos os
-- serviços — ajustável depois em Painel → Profissionais.
-- ---------------------------------------------------------------------------
insert into public.professionals (id, name, display_order) values
  ('00000000-0000-0000-0000-00000000a001', 'Lucas', 1),
  ('00000000-0000-0000-0000-00000000a002', 'Crespo', 2),
  ('00000000-0000-0000-0000-00000000a003', 'Vênus', 3);

insert into public.professional_services (professional_id, service_id)
select p.id, s.id
from public.professionals p
cross join public.services s;

-- ---------------------------------------------------------------------------
-- appointments: profissional responsável + tamanho do cabelo informado.
-- ---------------------------------------------------------------------------
alter table public.appointments
  add column professional_id uuid references public.professionals (id) on delete restrict,
  add column hair_length text check (hair_length in ('short', 'medium', 'long', 'very_long'));

update public.appointments
set professional_id = '00000000-0000-0000-0000-00000000a001'
where professional_id is null;

-- Compatibilidade: o código publicado antes desta migration não envia
-- professional_id. Em vez de o insert falhar entre "migration aplicada" e
-- "código novo publicado", o agendamento cai no primeiro profissional ativo
-- (o mesmo comportamento de 1 profissional que existia até aqui). O código
-- novo sempre envia o profissional, então isso só age em insert legado.
-- security definer: roda no insert público (anon) sem depender da RLS de
-- leitura de professionals.
create or replace function public.appointments_default_professional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.professional_id is null then
    select id into new.professional_id
    from public.professionals
    where active
    order by display_order, created_at
    limit 1;
  end if;
  return new;
end;
$$;

create trigger appointments_default_professional
before insert on public.appointments
for each row execute function public.appointments_default_professional();

alter table public.appointments
  alter column professional_id set not null;

create index appointments_professional_idx on public.appointments (professional_id, starts_at);

-- Conflito agora é por profissional: 14:00 do Lucas não bloqueia 14:00 de
-- outro profissional. Cancelados continuam não contando.
alter table public.appointments drop constraint appointments_no_overlap;

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status <> 'cancelled');

-- ---------------------------------------------------------------------------
-- blocked_slots: null = estúdio inteiro; preenchido = folga/bloqueio daquele
-- profissional.
-- ---------------------------------------------------------------------------
alter table public.blocked_slots
  add column professional_id uuid references public.professionals (id) on delete cascade;

create index blocked_slots_professional_idx on public.blocked_slots (professional_id, starts_at);

-- Antes: nenhum bloqueio podia sobrepor outro. Agora dois profissionais podem
-- ter folga no mesmo horário; só não se repete bloqueio sobreposto pra mesma
-- "agenda" (o estúdio inteiro conta como uma agenda à parte).
alter table public.blocked_slots drop constraint blocked_slots_no_overlap;

alter table public.blocked_slots
  add constraint blocked_slots_no_overlap
  exclude using gist (
    coalesce(professional_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  );

-- ---------------------------------------------------------------------------
-- busy_slots: mesma view pública (sem dado de cliente), agora com o
-- profissional. Coluna nova vai no fim pra `create or replace` aceitar —
-- quem só lê starts_at/ends_at (código antigo) continua funcionando e, sem
-- filtrar por profissional, trata tudo como ocupado (conservador, nunca
-- oferece horário a mais).
-- ---------------------------------------------------------------------------
create or replace view public.busy_slots as
select starts_at, ends_at, professional_id from public.appointments where status <> 'cancelled'
union all
select starts_at, ends_at, professional_id from public.blocked_slots;

grant select on public.busy_slots to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.professionals enable row level security;
alter table public.professional_services enable row level security;
alter table public.service_hair_durations enable row level security;

-- professionals: público só vê ativos (nome/foto/descrição são conteúdo do
-- site); admin vê e gerencia tudo.
create policy professionals_public_read
  on public.professionals for select
  to anon
  using (active = true);

create policy professionals_admin_all
  on public.professionals for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

-- professional_services / service_hair_durations: só ids e minutos, nada
-- sensível — o agendamento público precisa ler pra montar o fluxo.
create policy professional_services_public_read
  on public.professional_services for select
  to anon
  using (true);

create policy professional_services_admin_all
  on public.professional_services for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy service_hair_durations_public_read
  on public.service_hair_durations for select
  to anon
  using (true);

create policy service_hair_durations_admin_all
  on public.service_hair_durations for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
