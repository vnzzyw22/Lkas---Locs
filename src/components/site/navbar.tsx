"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "#servicos", label: "Serviços" },
  { href: "#galeria", label: "Galeria" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="#topo" className="flex items-center gap-2">
          <Image
            src="/imagens/foto-logo-lkas.jpg"
            alt="Lkas Locs"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="font-bold text-brand-black">
            Lkas <span className="text-brand-red">Locs</span>
          </span>
        </Link>

        <ul className="hidden gap-6 text-sm font-medium text-neutral-700 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition hover:text-brand-red">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-black/10 md:hidden"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-brand-black" />
            <span className="h-0.5 w-5 bg-brand-black" />
            <span className="h-0.5 w-5 bg-brand-black" />
          </div>
        </button>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-black/5 bg-white px-6 py-3 text-sm font-medium text-neutral-700 md:hidden">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-2 transition hover:text-brand-red"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
