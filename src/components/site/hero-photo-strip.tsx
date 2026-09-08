import Image from "next/image";
import { motion } from "framer-motion";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface HeroPhotoStripProps {
  photos: GalleryPhoto[];
}

// Versão mobile do deque de fotos: sem leque/parallax/hover-abrir (não faz
// sentido em tela estreita nem no toque) — só uma fileira de fotos reais
// do trabalho. O decalque de assinatura continua escondido no mobile (é
// decorativo; aqui as fotos reais importam mais pra quem está decidindo
// agendar). Ganhou flutuação idle (2026-09-08, "trazer um pouco da
// riqueza do desktop pro mobile") — mesma lógica do HeroPhotoDeck: roda
// mesmo com "reduzir animação" ativado no SO, decisão já tomada pelo
// cliente pra essa flutuação especificamente (decorativa, não
// scroll-linked). Fotos um pouco maiores que antes (h-24/w-20 -> h-28/
// w-24) pra ter mais presença.
export function HeroPhotoStrip({ photos }: HeroPhotoStripProps) {
  const heroPhotos = photos.slice(0, 3);

  if (heroPhotos.length === 0) return null;

  return (
    <div className="flex gap-3 sm:hidden">
      {heroPhotos.map((photo, i) => {
        const baseRotate = i % 2 === 0 ? 2 : -2;

        return (
          <motion.div
            key={photo.id}
            animate={{
              y: [0, -8, 0],
              rotate: [baseRotate - 1, baseRotate + 1, baseRotate - 1],
            }}
            transition={{
              duration: 4.5 + i * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative h-28 w-24 shrink-0 overflow-hidden border-2 border-brand-cream/80 shadow-lg shadow-black/40"
          >
            <Image
              src={photo.url}
              alt={photo.category ?? "Trabalho Lkas Locs"}
              fill
              sizes="140px"
              priority={i < 2}
              className="object-cover"
            />
          </motion.div>
        );
      })}
    </div>
  );
}
