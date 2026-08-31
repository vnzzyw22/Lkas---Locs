"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { HairDecal } from "./hair-decal";
import { HeroPhotoDeck } from "./hero-photo-deck";
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

    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
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
    });

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
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-20 mx-auto flex min-h-[74svh] max-w-[1500px] flex-col px-6 pt-10 pb-10 sm:min-h-[78svh] sm:px-10 sm:pt-12 lg:px-16"
      >
        <div className="flex items-start justify-between gap-6">
          <motion.p
            variants={fadeUp}
            className="font-label text-xs tracking-[0.25em] text-brand-smoke uppercase"
          >
            Locs · Tranças · Twists
          </motion.p>

          <HeroPhotoDeck
            photos={photos}
            triggerRef={sectionRef}
            reduceMotion={!!reduceMotion}
          />
        </div>

        <div className="relative mt-6 mb-6 lg:mt-8 lg:mb-8">
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

          {/* decalque ancorado ao lado do "LOCS", ver
              public/imagens/posição-que-deve-ficar-os-decalques-que-eu-adicionei.png */}
          <motion.div
            variants={fadeUp}
            className="pointer-events-none absolute top-0 right-0 hidden w-36 sm:block sm:w-44 lg:w-60"
          >
            <HairDecal className="h-auto w-full" />
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
