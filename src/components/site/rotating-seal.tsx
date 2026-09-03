"use client";

import { useId } from "react";

// Selo circular giratório (2026-09-03), a pedido do cliente — anel de
// texto em curva ao redor do medalhão da logo em about-section.tsx.
// Puramente decorativo (`aria-hidden`), texto via SVG `<textPath>` sobre
// um `<path>` circular. Gira sem parar via `@keyframes seal-spin` em
// globals.css (CSS puro, sem Framer Motion) — mesma decisão já tomada pra
// flutuação idle das fotos (hero-photo-deck.tsx) e pro vídeo de fundo
// removido: ambiente decorativo continua girando mesmo com "reduzir
// animação" ativado no SO, ao contrário do parallax do GSAP, que respeita
// essa preferência. `useId()` evita colisão de id se este selo aparecer
// mais de uma vez na página.
//
// Ajuste de feedback: o raio do círculo de texto (38 de 100) ficava quase
// idêntico ao raio da logo dentro do container (~31-32 de 100, ver
// about-section.tsx) — as letras caíam bem em cima da borda da logo,
// meio escondidas atrás dela ao girar ("frase cortada"). Raio aumentado
// pra 44 (bem além da borda da logo), com folga tanto pra dentro (não
// encosta na logo) quanto pra fora (não estoura os 50 do viewBox).
//
// Segundo ajuste de feedback: com raio 44 a circunferência do caminho
// (2π×44 ≈ 276 unidades) é maior que 2 repetições da frase (~200
// unidades) — sobrava um trecho do círculo sem texto nenhum ("buraco").
// 3 repetições cobre a circunferência inteira com folga; o excesso além
// do fim do `<path>` simplesmente não é desenhado (SVG não dá erro nem
// sobra pra fora), então não tem problema passar do necessário.
const SEAL_TEXT =
  "LKAS LOCS • MARINGÁ • LKAS LOCS • MARINGÁ • LKAS LOCS • MARINGÁ • ";

export function RotatingSeal() {
  const pathId = useId();

  return (
    <div aria-hidden="true" className="seal-spin h-full w-full">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        <defs>
          <path
            id={pathId}
            d="M 50,50 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
          />
        </defs>
        <text
          className="font-nav fill-brand-cream font-bold uppercase"
          style={{ fontSize: "6.5px" }}
          letterSpacing="1px"
        >
          <textPath href={`#${pathId}`} startOffset="0%">
            {SEAL_TEXT}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
