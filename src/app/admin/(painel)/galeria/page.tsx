import { GalleryManager } from "@/components/admin/gallery-manager";
import { getAllGalleryPhotos } from "@/lib/supabase/admin-queries";

export default async function GaleriaPage() {
  const photos = await getAllGalleryPhotos();

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-black">Galeria</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Fotos publicadas aparecem no site. Máx. 5MB por imagem.
      </p>
      <GalleryManager photos={photos} />
    </div>
  );
}
