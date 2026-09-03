"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
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
// deixar vazio abaixo dele), o quanto cada foto se espalha conforme a
// Hero é rolada (leque, GSAP) e o alvo de "abrir em fileira" no
// hover/toque (`expand`, puro CSS via `group-hover`/`group-active` — não
// dá pra usar framer-motion aqui porque o GSAP já controla x/y/rotation
// do mesmo elemento pai via scroll; a translação de abrir vive numa
// camada própria, entre o GSAP e a flutuação idle, então nada se
// sobrescreve). `expand` já cancela o `baseRotate` do elemento pai
// (rotate contrário) pra fila ficar nivelada. Suporta até 4 fotos — hoje
// só há 2 na galeria, mas o layout já está pronto pra quando mais forem
// adicionadas.
const SLOTS = [
  {
    top: "0%",
    right: "24%",
    size: "h-32 w-28 sm:h-36 sm:w-32 lg:h-44 lg:w-40",
    baseRotate: -7,
    fanY: 70,
    fanX: -14,
    fanRotate: -12,
    expand:
      "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[-105px] group-hover:translate-y-[30px] group-hover:rotate-[7deg] group-active:translate-x-[-105px] group-active:translate-y-[30px] group-active:rotate-[7deg] lg:group-hover:translate-x-[-131px] lg:group-hover:translate-y-[40px] lg:group-active:translate-x-[-131px] lg:group-active:translate-y-[40px]",
  },
  {
    top: "18%",
    right: "0%",
    size: "h-32 w-28 sm:h-36 sm:w-32 lg:h-44 lg:w-40",
    baseRotate: 5,
    fanY: 130,
    fanX: 10,
    fanRotate: 11,
    // esta é a foto mais à direita (colada na borda) — no aberto ela não
    // pode ir mais pra direita (é o que estava cortando ela pra fora da
    // tela), só um respiro pra esquerda; quem viaja mesmo é a slot0.
    expand:
      "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[-15px] group-hover:translate-y-[-10px] group-hover:rotate-[-5deg] group-active:translate-x-[-15px] group-active:translate-y-[-10px] group-active:rotate-[-5deg] lg:group-hover:translate-x-[-20px] lg:group-hover:translate-y-[-12px] lg:group-active:translate-x-[-20px] lg:group-active:translate-y-[-12px]",
  },
  {
    top: "38%",
    right: "32%",
    size: "h-28 w-24 sm:h-32 sm:w-28 lg:h-40 lg:w-36",
    baseRotate: -4,
    fanY: 200,
    fanX: -22,
    fanRotate: -9,
    expand:
      "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[-231px] group-hover:translate-y-[-55px] group-hover:rotate-[4deg] group-active:translate-x-[-231px] group-active:translate-y-[-55px] group-active:rotate-[4deg] lg:group-hover:translate-x-[-288px] lg:group-hover:translate-y-[-69px] lg:group-active:translate-x-[-288px] lg:group-active:translate-y-[-69px]",
  },
  {
    top: "12%",
    right: "50%",
    size: "h-24 w-20 sm:h-28 sm:w-24 lg:h-32 lg:w-28",
    baseRotate: 8,
    fanY: 260,
    fanX: 18,
    fanRotate: 15,
    expand:
      "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[-319px] group-hover:translate-y-[3px] group-hover:rotate-[-8deg] group-active:translate-x-[-319px] group-active:translate-y-[3px] group-active:rotate-[-8deg] lg:group-hover:translate-x-[-400px] lg:group-hover:translate-y-[6px] lg:group-active:translate-x-[-400px] lg:group-active:translate-y-[6px]",
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

    // gsap + ScrollTrigger só entram aqui dentro, pós-montagem —
    // importados dinamicamente pra não engordar o bundle inicial.
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
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
      },
    );

    return () => cleanup();
  }, [reduceMotion, triggerRef]);

  if (heroPhotos.length === 0) return null;

  return (
    <div className="group relative hidden h-56 w-56 shrink-0 cursor-pointer hover:z-30 active:z-30 sm:block lg:h-72 lg:w-72">
      {/* alvo de hover/toque bem maior que a caixa visual das fotos — só
          um retângulo invisível (sem estilo, não intercepta nada visualmente)
          pra facilitar acertar o gesto. Estica bem pra baixo/esquerda (espaço
          vazio da Hero) e pouco pra cima/direita, pra não invadir a navbar
          fixa (`sticky top-0 z-50`) nem chegar perto do CTA lá embaixo. Como
          é descendente do mesmo `group`, passar o mouse/dedo aqui já ativa
          o `group-hover`/`group-active` das fotos normalmente. */}
      <div
        aria-hidden="true"
        className="absolute -top-4 -right-4 -bottom-28 -left-32 lg:-bottom-36 lg:-left-44"
      />

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
              {/* abrir em fileira no hover/toque do grupo — puro CSS, ver
                  comentário do SLOTS acima */}
              <div className={slot.expand}>
                {/* flutuação idle: decorativa, não ligada a scroll — roda
                    mesmo com "reduzir animação" ativado no SO (decisão do
                    cliente), diferente do parallax do GSAP acima, que
                    respeita a preferência */}
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5] }}
                  transition={{
                    duration: 5 + i * 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`relative ${slot.size} overflow-hidden border-2 border-brand-cream/80 shadow-xl shadow-black/40`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.category ?? "Trabalho Lkas Locs"}
                    fill
                    sizes="200px"
                    priority={i < 2}
                    className="object-cover"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
