-- Popula gallery_photos com as fotos de portfólio já disponíveis em
-- public/imagens (já têm marca d'água própria — ok para galeria, ver
-- CLAUDE.md). Editável depois pelo painel administrativo (Fase 4).

insert into public.gallery_photos (url, category, display_order) values
  ('/imagens/foto-tranças-1.jpg', 'tranças', 1),
  ('/imagens/foto-tranças-2.jpg', 'tranças', 2);
