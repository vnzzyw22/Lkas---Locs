"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { RefObject } from "react";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface HeroPhotoDeckProps {
  photos: GalleryPhoto[];
  triggerRef: RefObject<HTMLElement | null>;
  reduceMotion: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// Posição de repouso (deque quase fechado, já grande o bastante pra não
// deixar vazio abaixo dele) e o quanto cada foto se espalha conforme a
// Hero é rolada (leque). Suporta até 4 fotos — hoje só há 2 na galeria,
// mas o layout já está pronto pra quando mais forem adicionadas.
const SLOTS = [
  {
    top: "0%",
    right: "24%",
    size: "h-32 w-28 sm:h-36 sm:w-32 lg:h-44 lg:w-40",
    baseRotate: -7,
    fanY: 70,
    fanX: -14,
    fanRotate: -12,
  },
  {
    top: "18%",
    right: "0%",
    size: "h-32 w-28 sm:h-36 sm:w-32 lg:h-44 lg:w-40",
    baseRotate: 5,
    fanY: 130,
    fanX: 10,
    fanRotate: 11,
  },
  {
    top: "38%",
    right: "32%",
    size: "h-28 w-24 sm:h-32 sm:w-28 lg:h-40 lg:w-36",
    baseRotate: -4,
    fanY: 200,
    fanX: -22,
    fanRotate: -9,
  },
  {
    top: "12%",
    right: "50%",
    size: "h-24 w-20 sm:h-28 sm:w-24 lg:h-32 lg:w-28",
    baseRotate: 8,
    fanY: 260,
    fanX: 18,
    fanRotate: 15,
  },
];

export function HeroPhotoDeck({
  photos,
  triggerRef,
  reduceMotion,
}: HeroPhotoDeckProps) {
  const heroPhotos = photos.slice(0, 4);
  const fanRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduceMotion || !triggerRef.current) return;

    let cleanup = () => {};

    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        fanRefs.current.forEach((el, i) => {
          if (!el) return;
          const slot = SLOTS[i];

          gsap.to(el, {
            y: slot.fanY,
            x: slot.fanX,
            rotation: slot.baseRotate + slot.fanRotate,
            ease: "none",
            scrollTrigger: {
              trigger: triggerRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        });
      });

      cleanup = () => ctx.revert();
    });

    return () => cleanup();
  }, [reduceMotion, triggerRef]);

  if (heroPhotos.length === 0) return null;

  return (
    <div className="relative hidden h-56 w-56 shrink-0 sm:block lg:h-72 lg:w-72">
      {heroPhotos.map((photo, i) => {
        const slot = SLOTS[i];

        return (
          <motion.div
            key={photo.id}
            variants={fadeUp}
            className="absolute"
            style={{ top: slot.top, right: slot.right }}
          >
            <div
              ref={(el) => {
                fanRefs.current[i] = el;
              }}
              style={{ transform: `rotate(${slot.baseRotate}deg)` }}
            >
              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : { rotate: [-1.5, 1.5, -1.5] }
                }
                transition={{
                  duration: 5 + i * 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`${slot.size} overflow-hidden border-2 border-brand-cream/80 shadow-xl shadow-black/40`}
              >
                <Image
                  src={photo.url}
                  alt={photo.category ?? "Trabalho Lkas Locs"}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
