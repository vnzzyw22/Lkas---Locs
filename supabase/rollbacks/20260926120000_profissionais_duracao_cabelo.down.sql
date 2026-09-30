-- Rollback de supabase/migrations/20260926120000_profissionais_duracao_cabelo.sql.
-- Não é aplicado automaticamente pelo `supabase db push` (fica fora de
-- migrations/ de propósito) — rodar à mão no SQL Editor só se for preciso
-- voltar atrás, e só DEPOIS de voltar o código publicado pra versão anterior
-- (o código novo lê as tabelas que este arquivo remove).
--
-- ⚠️ Perde o que foi criado depois da migration: profissionais extras,
-- vínculo serviço↔profissional, durações por tamanho, o tamanho informado nos
-- agendamentos e a qual profissional cada agendamento/bloqueio pertence.
-- Agendamentos e bloqueios em si continuam lá.
-- ⚠️ A constraint global antiga só volta se não houver dois agendamentos
-- ativos (ou dois bloqueios) sobrepostos em profissionais diferentes. Se
-- houver, o `add constraint` falha e a transação inteira é desfeita —
-- resolva os conflitos (cancelar um dos lados) e rode de novo.

begin;

-- View volta ao formato antigo (drop + create: `create or replace` não
-- consegue remover coluna).
drop view public.busy_slots;
create view public.busy_slots as
select starts_at, ends_at from public.appointments where status <> 'cancelled'
union all
select starts_at, ends_at from public.blocked_slots;
grant select on public.busy_slots to anon, authenticated;

alter table public.blocked_slots drop constraint blocked_slots_no_overlap;
alter table public.blocked_slots
  add constraint blocked_slots_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&);
drop index public.blocked_slots_professional_idx;
alter table public.blocked_slots drop column professional_id;

alter table public.appointments drop constraint appointments_no_overlap;
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
  where (status <> 'cancelled');
drop trigger appointments_default_professional on public.appointments;
drop function public.appointments_default_professional();
drop index public.appointments_professional_idx;
alter table public.appointments drop column hair_length;
alter table public.appointments drop column professional_id;

drop table public.service_hair_durations;
drop table public.professional_services;
drop table public.professionals;

-- btree_gist fica instalada: é inofensiva e pode estar em uso por outra coisa.

commit;
