"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "#topo", label: "Início" },
  { href: "#servicos", label: "Serviços" },
  { href: "#galeria", label: "Galeria" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-ink/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="#topo" className="flex items-center gap-2.5">
          <Image
            src="/imagens/foto-logo-lkas.jpg"
            alt="Lkas Locs"
            width={36}
            height={36}
            className="rounded-full ring-1 ring-white/20"
          />
          <span className="font-display text-sm font-bold tracking-wide text-brand-cream">
            LKAS <span className="text-brand-red">LOCS</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-7 font-label text-xs tracking-widest text-brand-smoke uppercase md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="transition-colors hover:text-brand-cream"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <Link
          href="/agendar"
          className="hidden rounded-full bg-brand-red px-5 py-2 font-label text-xs font-medium tracking-widest text-brand-cream uppercase transition hover:opacity-90 md:inline-block"
        >
          Agendar
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 md:hidden"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-brand-cream" />
            <span className="h-0.5 w-5 bg-brand-cream" />
            <span className="h-0.5 w-5 bg-brand-cream" />
          </div>
        </button>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 bg-brand-ink px-6 py-3 font-label text-xs tracking-widest text-brand-smoke uppercase md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-2 transition-colors hover:text-brand-cream"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/agendar"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-brand-red px-4 py-2 text-center text-brand-cream normal-case"
          >
            Agendar horário
          </Link>
        </div>
      )}
    </header>
  );
}
