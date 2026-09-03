import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Lkas Locs",
};

// Placeholder — conteúdo legal real ainda não definido com o cliente. Ver
// nota em src/app/politica-de-privacidade/page.tsx.
export default function TermosDeUsoPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-brand-ink px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-brand-cream uppercase sm:text-3xl">
        Termos de <span className="text-brand-red">Uso</span>
      </h1>
      <p className="max-w-md text-brand-smoke">
        Este conteúdo ainda está em preparação. Em caso de dúvida sobre o uso
        do site, fale diretamente com a Lkas Locs.
      </p>
      <Link
        href="/"
        className="font-label text-xs tracking-widest text-brand-red uppercase hover:underline"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
