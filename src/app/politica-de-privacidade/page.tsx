import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Lkas Locs",
};

// Placeholder — conteúdo legal real ainda não definido com o cliente. Mesmo
// padrão de "em construção" já usado no painel admin antes da Fase 4 (ver
// CLAUDE.md), pra não deixar o link do rodapé morto nem inventar um texto
// jurídico que ninguém revisou.
export default function PoliticaDePrivacidadePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-brand-ink px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-brand-cream uppercase sm:text-3xl">
        Política de <span className="text-brand-red">Privacidade</span>
      </h1>
      <p className="max-w-md text-brand-smoke">
        Este conteúdo ainda está em preparação. Em caso de dúvida sobre o uso
        dos seus dados, fale diretamente com a Lkas Locs.
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
