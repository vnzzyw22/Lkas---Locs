import { GalleryGrid } from "./gallery-grid";
import { Reveal } from "./reveal";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface GallerySectionProps {
  photos: GalleryPhoto[];
}

export function GallerySection({ photos }: GallerySectionProps) {
  return (
    <section id="galeria" className="bg-neutral-50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="text-center font-display text-2xl font-bold text-brand-black sm:text-3xl">
            Nossa <span className="text-brand-red">Galeria</span>
          </h2>
        </Reveal>

        {photos.length === 0 ? (
          <p className="mt-8 text-center text-neutral-500">
            Fotos em breve.
          </p>
        ) : (
          <GalleryGrid photos={photos} />
        )}
      </div>
    </section>
  );
}
