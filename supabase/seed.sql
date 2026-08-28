-- Seed da Fase 1. Preços e durações abaixo são PLACEHOLDER — ajustar com base em
-- pesquisa de mercado real. Tudo aqui é editável depois pelo painel administrativo.

insert into public.business_settings (id, name, whatsapp, instagram, address, business_hours)
values (
  '00000000-0000-0000-0000-000000000001',
  'Lkas Locs',
  null,
  null,
  'R. Catulo Cearense, 251 — Maringá - PR',
  '{
    "mon": {"open": "09:00", "close": "19:00"},
    "tue": {"open": "09:00", "close": "19:00"},
    "wed": {"open": "09:00", "close": "19:00"},
    "thu": {"open": "09:00", "close": "19:00"},
    "fri": {"open": "09:00", "close": "19:00"},
    "sat": {"open": "09:00", "close": "19:00"},
    "sun": {"closed": true}
  }'::jsonb
);

insert into public.services (name, price, duration_minutes, display_order) values
  ('Loctian',            50.00,  60, 1),
  ('Barbeiro',           40.00,  45, 2),
  ('Terapeuta Capilar',  80.00,  60, 3),
  ('Starter Locs',      350.00, 240, 4),
  ('Retwist',           150.00, 120, 5),
  ('Barrel',            120.00,  90, 6),
  ('Tranças',           200.00, 180, 7),
  ('Twists',            180.00, 150, 8);
