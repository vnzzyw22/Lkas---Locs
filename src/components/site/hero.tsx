"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { HeroPhotoDeck } from "./hero-photo-deck";
import { HeroPhotoStrip } from "./hero-photo-strip";
import type { BusinessSettings, GalleryPhoto } from "@/lib/supabase/types";

interface HeroProps {
  business: BusinessSettings | null;
  photos: GalleryPhoto[];
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero({ business, photos }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !sectionRef.current) return;

    let cleanup = () => {};

    // gsap (~200KB) e o ScrollTrigger só são usados aqui dentro, depois
    // da montagem — importar os dois dinamicamente evita que entrem no
    // bundle inicial da página (fora quando `reduceMotion` já corta o
    // efeito antes de baixar qualquer coisa).
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          gsap.to(bgRef.current, {
            yPercent: 18,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }, sectionRef);

        cleanup = () => ctx.revert();
      },
    );

    return () => cleanup();
  }, [reduceMotion]);

  return (
    <section
      id="topo"
      ref={sectionRef}
      className="relative bg-brand-ink text-brand-cream"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          ref={bgRef}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 78% 18%, var(--color-brand-oxblood) 0%, transparent 65%), radial-gradient(50% 45% at 12% 85%, var(--color-brand-oxblood) 0%, transparent 60%)",
          }}
        />

        {/* decalque real em marca d'água: textura de fundo, escala gigante,
            sangrando pelas bordas — ver public/imagens/decal-locs-02.png e
            scripts/process-decals.mjs (gerado a partir do jpg fornecido
            pelo cliente, fundo tornado transparente de verdade) */}
        <Image
          src="/imagens/decal-locs-02.png"
          alt=""
          aria-hidden="true"
          width={926}
          height={751}
          className="absolute -bottom-16 -left-24 w-[75vw] max-w-[880px] min-w-[420px] -rotate-6 opacity-[0.08]"
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-20 mx-auto flex min-h-[74svh] max-w-[1500px] flex-col px-6 pt-10 pb-10 sm:min-h-[78svh] sm:px-10 sm:pt-12 lg:px-16"
      >
        <div className="relative">
          <motion.p
            variants={fadeUp}
            className="font-label text-xs tracking-[0.25em] text-brand-smoke uppercase"
          >
            Locs · Tranças · Twists
          </motion.p>

          {/* fora do fluxo: o deque de fotos não pode mais empurrar o
              título pra baixo reservando altura de flex-row (era isso que
              impedia o título de subir) */}
          <div className="pointer-events-none absolute top-0 right-0 sm:pointer-events-auto">
            {/* decalque real colado ATRÁS da colagem de fotos — como se
                fizesse parte física dela, pontas escapando pelas bordas
                (abordagem "integração com as fotos" validada na conversa
                com o cliente, ver DESIGN.md > Decalque de assinatura).
                Vem antes no DOM = empilha atrás, sem precisar de z-index. */}
            <motion.div
              variants={fadeUp}
              className="pointer-events-none absolute -top-8 -left-12 hidden w-64 -rotate-[18deg] sm:block sm:w-72 lg:-top-12 lg:-left-16 lg:w-96"
            >
              <Image
                src="/imagens/decal-locs-01.png"
                alt=""
                aria-hidden="true"
                width={750}
                height={935}
                className="h-auto w-full"
              />
            </motion.div>

            <HeroPhotoDeck
              photos={photos}
              triggerRef={sectionRef}
              reduceMotion={!!reduceMotion}
            />
          </div>
        </div>

        <div className="relative mt-4 mb-6 lg:mt-6 lg:mb-8">
          <motion.h1
            variants={fadeUp}
            className="font-display leading-[0.82] font-black tracking-tight"
            style={{ fontSize: "clamp(3.25rem, 12vw, 9.5rem)" }}
          >
            <span className="block text-brand-red">LKAS</span>
            <span
              className="mt-1 block text-transparent lg:ml-16"
              style={{ WebkitTextStroke: "2px var(--color-brand-cream)" }}
            >
              LOCS
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xs font-label text-xs leading-relaxed tracking-widest text-brand-smoke uppercase lg:ml-16"
          >
            {business?.address ?? "Maringá — PR"}
          </motion.p>

          {/* fileira estática só pro mobile — ver hero-photo-strip.tsx.
              Acima de sm, o deque com leque/parallax (HeroPhotoDeck) já
              cobre isso. */}
          <motion.div variants={fadeUp} className="mt-6">
            <HeroPhotoStrip photos={photos} />
          </motion.div>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-8 pt-8">
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <span className="font-label text-[11px] tracking-[0.3em] text-brand-smoke uppercase">
              Agendamento online
            </span>
            <Link
              href="/agendar"
              className="group inline-flex w-fit items-center gap-3 rounded-full bg-brand-cream px-7 py-3.5 font-label text-xs font-medium tracking-widest text-brand-ink uppercase transition hover:bg-brand-red hover:text-brand-cream"
            >
              Agendar horário
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </motion.div>

          <motion.a
            variants={fadeUp}
            href="#servicos"
            className="hidden flex-col items-center gap-2 font-label text-[10px] tracking-[0.3em] text-brand-smoke uppercase sm:flex"
          >
            Explorar
            <span className="h-10 w-px animate-pulse bg-brand-smoke" />
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
