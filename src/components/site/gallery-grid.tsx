"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { Reveal } from "./reveal";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface GalleryGridProps {
  photos: GalleryPhoto[];
}

// Parallax leve por foto (velocidades alternadas) enquanto a Galeria é
// rolada — o "imagens reveladas durante o scroll" do brief, sem exagerar
// (só translateY sutil, nada além disso).
export function GalleryGrid({ photos }: GalleryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !gridRef.current) return;

    let cleanup = () => {};

    // gsap + ScrollTrigger só entram aqui dentro, pós-montagem —
    // importados dinamicamente pra não engordar o bundle inicial.
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          const cards =
            gridRef.current?.querySelectorAll("[data-parallax-card]");
          cards?.forEach((card, i) => {
            gsap.to(card, {
              yPercent: i % 2 === 0 ? -8 : 8,
              ease: "none",
              scrollTrigger: {
                trigger: gridRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            });
          });
        }, gridRef);

        cleanup = () => ctx.revert();
      },
    );

    return () => cleanup();
  }, [reduceMotion]);

  return (
    <div ref={gridRef} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
      {photos.map((photo, i) => (
        <Reveal key={photo.id} delay={(i % 3) * 0.08}>
          <div
            data-parallax-card
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
        </Reveal>
      ))}
    </div>
  );
}
