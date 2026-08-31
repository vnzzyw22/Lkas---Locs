-- Substitui as fotos de portfólio placeholder pelas 3 fotos reais
-- adicionadas pelo cliente (public/imagens/SaveClip.App_*.jpg). As 2
-- fotos antigas ficam despublicadas (não deletadas — reversível pelo
-- painel a qualquer momento) pra a home mostrar só as novas, como pedido.

update public.gallery_photos
set published = false
where url in ('/imagens/foto-tranças-1.jpg', '/imagens/foto-tranças-2.jpg');

insert into public.gallery_photos (url, category, display_order) values
  ('/imagens/SaveClip.App_765671239_18607536202014621_5448867882576857794_n.jpg', 'locs', 1),
  ('/imagens/SaveClip.App_766241348_18607536184014621_7733524481166955801_n.jpg', 'locs', 2),
  ('/imagens/SaveClip.App_766287922_18607536193014621_1041284762469929787_n.jpg', 'locs', 3);
