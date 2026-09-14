import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Montserrat, Sora, Unbounded } from "next/font/google";
import { getBusinessSettings } from "@/lib/supabase/queries";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

// Segunda fonte de destaque (2026-09-03), a pedido do cliente — mesmo
// gênero geométrico/bold do Unbounded, mas com traço mais suave (curvas
// arredondadas em vez de cortes angulares). Uso pontual: só o título do FAQ
// por enquanto, pra diferenciar essa seção do tratamento "poster" de
// Serviços/Galeria sem sair da família editorial do site.
const sora = Sora({
  variable: "--font-heading-soft",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Fonte só da Navbar (2026-09-03), a pedido do cliente — "muito mais
// profissional e moderno" pros links do menu, em vez do mono
// (`font-label`) usado no resto do site pra legendas/dados factuais.
const montserrat = Montserrat({
  variable: "--font-nav",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// generateMetadata (não um objeto estático) pra puxar o nome/endereço reais
// de business_settings — nada de marca fixa no código, mesmo princípio já
// seguido no resto do site (importante pro modelo de reuso por cliente).
export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessSettings();
  const name = business?.name ?? "Lkas Locs";
  const description = business?.address
    ? `Locs, tranças, twists, cuidados capilares e barbearia — ${business.address}.`
    : "Locs, tranças, twists, cuidados capilares e barbearia — Maringá, PR.";
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      url: siteUrl,
      siteName: name,
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${unbounded.variable} ${sora.variable} ${montserrat.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-brand-red focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Pular para o conteúdo
        </a>
        {/*
          THESIS: Lkas Locs' Hero owns "editorial fashion house that
          happens to braid hair" — refuses the generic salon hero
          (centered headshot, pastel gradient, rounded cards).
          OWN-WORLD: near-black warm ground, brand red carrying 30-60%
          of the surface via massive display type + hand-drawn stroke
          linework, warm off-white text, oxblood depth layers.
          Unbounded display, JetBrains Mono scattered factual captions,
          asymmetric overlapping composition, wide breathing margins,
          hand-drawn SVG braid/loc decals stroke-drawn on load,
          bottom-bleeding.
          STORY: visitor reads a premium, street-fashion hair studio,
          not a generic salon; books a horário or scrolls to see the
          craft.
          FIRST VIEWPORT: full-bleed near-black Hero. Giant asymmetric
          "LKAS LOCS" wordmark (Unbounded, ~9-14vw), mixed red-fill /
          red-outline. Small rotated photo duo top-right (real
          portfolio shots). Scattered mono captions (endereço,
          horário, contagem de serviços) placed around the
          composition, never stacked as a kicker. Hand-drawn SVG
          braid/loc decal anchored bottom, bleeding past the viewport
          edge. CTA "Agendar horário" bottom-left.
          FORM: editorial streetwear fashion-magazine hero, pinned by
          the user's explicit brief (Dribbble Auralee reference) — no
          direction roll. seed: brief-pinned/lkas-hero-v1.
          FINISH: unreviewed and undocumented is unfinished; this
          build ends with the finish review, the verdict, DESIGN.md,
          and every shipping raster carrying its provenance.
        */}
        {children}
      </body>
    </html>
  );
}
