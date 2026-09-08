"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { GalleryPhoto } from "@/lib/supabase/types";

interface GalleryCarouselProps {
  photos: GalleryPhoto[];
}

const AUTOPLAY_MS = 5000;
const TOUCH_RESUME_MS = 4000;
const SWIPE_THRESHOLD = 40;
const EASE = [0.16, 1, 0.3, 1] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Portfólio editorial de uma foto por vez (2026-09-08), substituindo a
// grade de cards anterior (gallery-grid.tsx, removido) -- pedido do
// cliente. Track deslizante (translateX em % por slide) em vez de
// AnimatePresence com mount/unmount: todas as fotos ficam montadas desde
// o início (sem "pulo" ao trocar, sem re-fetch da imagem a cada troca) e
// só a posição/escala mudam. Como as fotos ficam fora da tela via
// `transform`, o IntersectionObserver do next/image ainda as trata como
// fora da viewport e adia o carregamento normalmente -- só a primeira
// entra com `priority`.
export function GalleryCarousel({ photos }: GalleryCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchStartX = useRef(0);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = photos.length;
  const canNavigate = total > 1;

  function goTo(nextIndex: number) {
    setIndex(((nextIndex % total) + total) % total);
  }

  useEffect(() => {
    if (isPaused || !canNavigate) return undefined;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [isPaused, canNavigate, total, index]);

  useEffect(() => {
    return () => {
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD) goTo(index + 1);
    else if (delta > SWIPE_THRESHOLD) goTo(index - 1);
    resumeTimeout.current = setTimeout(() => setIsPaused(false), TOUCH_RESUME_MS);
  }

  const current = photos[index];
  const caption = current.category?.trim();
  const transition = {
    duration: reduceMotion ? 0.12 : 0.85,
    ease: EASE,
  };

  return (
    <div className="mx-auto mt-10 max-w-xl lg:max-w-2xl">
      <div
        className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-2xl bg-neutral-200 ring-1 ring-brand-black/5"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          className="flex h-full"
          animate={{ x: `-${index * 100}%` }}
          transition={transition}
        >
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              className="relative h-full w-full shrink-0"
              animate={{ scale: i === index ? 1 : 0.96 }}
              transition={transition}
            >
              <Image
                src={photo.url}
                alt={
                  photo.category
                    ? `Foto do trabalho: ${photo.category}`
                    : "Foto da Lkas Locs"
                }
                fill
                sizes="(min-width: 1024px) 640px, 90vw"
                priority={i === 0}
                className="object-cover"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div
        className="mt-5 flex items-center justify-between gap-4"
        aria-live="polite"
      >
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={!canNavigate}
          aria-label="Foto anterior"
          className="group inline-flex items-center gap-2 font-label text-xs font-medium tracking-widest text-brand-black/70 uppercase transition-colors hover:text-brand-red disabled:pointer-events-none disabled:opacity-30"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex flex-col items-center gap-1">
          {caption && (
            <span className="font-label text-xs tracking-widest text-brand-black uppercase">
              {caption}
            </span>
          )}
          {canNavigate && (
            <span className="font-label text-[11px] tabular-nums text-neutral-500">
              {pad(index + 1)} / {pad(total)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={!canNavigate}
          aria-label="Próxima foto"
          className="group inline-flex items-center gap-2 font-label text-xs font-medium tracking-widest text-brand-black/70 uppercase transition-colors hover:text-brand-red disabled:pointer-events-none disabled:opacity-30"
        >
          <span className="hidden sm:inline">Próximo</span>
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </div>
  );
}
