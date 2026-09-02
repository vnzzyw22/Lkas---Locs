import { GalleryGrid } from "./gallery-grid";
import { Reveal } from "./reveal";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface GallerySectionProps {
  photos: GalleryPhoto[];
}

export function GallerySection({ photos }: GallerySectionProps) {
  return (
    <section id="galeria" className="bg-brand-paper">
      <div className="mx-auto max-w-5xl px-6 py-24 lg:max-w-6xl">
        <Reveal>
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-center font-display text-4xl leading-none font-black tracking-tight uppercase sm:text-5xl lg:text-6xl">
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "1.5px var(--color-brand-black)" }}
              >
                Nossa
              </span>{" "}
              <span className="text-brand-red">Galeria</span>
            </h2>
            <span aria-hidden="true" className="h-px w-16 bg-brand-red/60" />
          </div>
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
