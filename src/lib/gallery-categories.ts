// Categorias reservadas que fazem uma foto aparecer no leque/fileira da
// Hero em vez da Galeria pública — evita que a mesma foto apareça
// duplicada nas duas seções (ver getHeroGalleryPhotos/getPublicGalleryPhotos
// em src/lib/supabase/queries.ts).
export const HERO_GALLERY_CATEGORIES = ["hero", "topo"];

export function isHeroCategory(category: string | null): boolean {
  return category !== null && HERO_GALLERY_CATEGORIES.includes(category);
}
