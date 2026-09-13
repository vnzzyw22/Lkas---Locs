import Image from "next/image";
import { motion } from "framer-motion";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface HeroPhotoCollageProps {
  photos: GalleryPhoto[];
}

// Composição editorial exclusiva do Hero MOBILE: 1 foto principal maior +
// 2 secundárias menores, sobrepostas de forma controlada e assimétrica —
// substitui a fileira lado a lado de mesmo tamanho (hero-photo-strip.tsx,
// removido). O deque com leque/parallax (HeroPhotoDeck) continua sendo o
// desktop, sem nenhuma alteração. Flutuação idle leve (mesma decisão já
// tomada pro mobile antes: roda mesmo com "reduzir animação" ativado no
// SO, por ser decorativa e não scroll-linked).
export function HeroPhotoCollage({ photos }: HeroPhotoCollageProps) {
  const heroPhotos = photos.slice(0, 3);
  if (heroPhotos.length === 0) return null;

  const [main, secondaryA, secondaryB] = heroPhotos;

  return (
    <div className="relative ml-auto h-56 w-52 sm:hidden">
      {secondaryB && (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1 left-0 h-24 w-20 -rotate-[9deg] overflow-hidden border-2 border-brand-cream/80 shadow-lg shadow-black/40"
        >
          <Image
            src={secondaryB.url}
            alt={secondaryB.category ?? "Trabalho Lkas Locs"}
            fill
            sizes="120px"
            className="object-cover"
          />
        </motion.div>
      )}

      {secondaryA && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
          className="absolute right-0 bottom-0 h-28 w-24 rotate-6 overflow-hidden border-2 border-brand-cream/80 shadow-lg shadow-black/40"
        >
          <Image
            src={secondaryA.url}
            alt={secondaryA.category ?? "Trabalho Lkas Locs"}
            fill
            sizes="140px"
            priority
            className="object-cover"
          />
        </motion.div>
      )}

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
        className="absolute top-0 right-4 h-40 w-32 -rotate-2 overflow-hidden border-2 border-brand-cream/90 shadow-xl shadow-black/50"
      >
        <Image
          src={main.url}
          alt={main.category ?? "Trabalho Lkas Locs"}
          fill
          sizes="160px"
          priority
          className="object-cover"
        />
      </motion.div>
    </div>
  );
}
