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

// Tipografia da Navbar (2026-09-03), a pedido do cliente: Montserrat em
// vez do mono (`font-label`) do resto do site, caixa alta, peso 700,
// tracking de 1px — "aspecto premium". Dropdown de "Serviços" (testado
// antes) foi removido a pedido do cliente: menu simples, todos os links
// direto na mesma linha, sem submenu.
const navLinkClass =
  "font-nav text-xs font-bold tracking-[1px] uppercase transition-colors duration-200 hover:text-brand-red";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand-ink/75 backdrop-blur-md">
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

        <ul className={`hidden items-center gap-7 text-brand-smoke md:flex`}>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={navLinkClass}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <Link
          href="/agendar"
          className="hidden rounded-md bg-brand-red px-5 py-2 font-label text-xs font-bold tracking-widest text-white uppercase transition-all duration-300 ease-in-out hover:brightness-110 md:inline-block"
        >
          Agendar
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
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
        <div className="flex flex-col gap-1 border-t border-white/10 bg-brand-ink px-6 py-3 text-brand-smoke md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block py-2 ${navLinkClass}`}
            >
              {link.label}
            </a>
          ))}

          <Link
            href="/agendar"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-brand-red px-4 py-2 text-center font-label text-xs font-medium tracking-widest text-brand-cream normal-case"
          >
            Agendar horário
          </Link>
        </div>
      )}
    </header>
  );
}
