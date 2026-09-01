import Image from "next/image";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface HeroPhotoStripProps {
  photos: GalleryPhoto[];
}

// Versão mobile do deque de fotos: sem leque/parallax/hover-abrir (não faz
// sentido em tela estreita nem no toque) — só uma fileira estática de
// fotos reais do trabalho. O decalque de assinatura continua escondido no
// mobile (é decorativo; aqui as fotos reais importam mais pra quem está
// decidindo agendar).
export function HeroPhotoStrip({ photos }: HeroPhotoStripProps) {
  const heroPhotos = photos.slice(0, 3);

  if (heroPhotos.length === 0) return null;

  return (
    <div className="flex gap-3 sm:hidden">
      {heroPhotos.map((photo, i) => (
        <div
          key={photo.id}
          className={`relative h-24 w-20 shrink-0 overflow-hidden border-2 border-brand-cream/80 shadow-lg shadow-black/40 ${
            i % 2 === 0 ? "rotate-2" : "-rotate-2"
          }`}
        >
          <Image
            src={photo.url}
            alt={photo.category ?? "Trabalho Lkas Locs"}
            fill
            sizes="120px"
            priority={i < 2}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
