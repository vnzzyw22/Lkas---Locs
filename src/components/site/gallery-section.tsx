import Image from "next/image";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface GallerySectionProps {
  photos: GalleryPhoto[];
}

export function GallerySection({ photos }: GallerySectionProps) {
  return (
    <section id="galeria" className="bg-neutral-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold text-brand-black sm:text-3xl">
          Nossa <span className="text-brand-red">Galeria</span>
        </h2>

        {photos.length === 0 ? (
          <p className="mt-8 text-center text-neutral-500">
            Fotos em breve.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-neutral-200"
              >
                <Image
                  src={photo.url}
                  alt={photo.category ?? "Foto da Lkas Locs"}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover transition hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
