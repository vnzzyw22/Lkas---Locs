"use client";

import { motion } from "framer-motion";

// Decalque desenhado à mão (street/fashion sketch) de locs/twists —
// nunca rosto, personagem ou clipart, ver PRODUCT.md > Brand Commitments.
//
// v3: cada loc é uma "fita" preenchida (silhueta), larga no topo e
// afunilando até a ponta embaixo — não uma linha fina aberta. Referência
// do cliente (public/imagens/exemplo-decalque.png): mechas grossas,
// silhueta sólida, pontas em bico. Geradas parametricamente (centerline
// senoidal sutil + largura decrescente, offset lateral pela normal da
// curva — igual a um "stroke de largura variável" desenhado manualmente
// como polígono fechado), determinístico por índice — sem Math.random,
// pra não divergir entre SSR e cliente. "Reveladas" via framer-motion
// (fade + leve escala) ao montar — silhuetas preenchidas não têm um
// traçado de contorno único pra animar como pathLength, então a entrada
// é opacidade/escala, não desenho progressivo.

interface HairDecalProps {
  className?: string;
  strandCount?: number;
  width?: number;
  height?: number;
}

type Point = [number, number];

function catmullRomPath(points: Point[]) {
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

// Continua um path já existente (que termina no primeiro ponto de
// `points`) com mais uma curva suave, trocando o "M" inicial por "L" pra
// emendar sem levantar a caneta.
function continuePath(points: Point[]) {
  const full = catmullRomPath(points);
  return full.replace(/^M([\d.-]+),([\d.-]+)/, "L$1,$2");
}

function buildRibbon(index: number, width: number, height: number) {
  const laneWidth = width / 5.2;
  const centerX = laneWidth * (index + 0.7) + Math.sin(index * 2.1) * laneWidth * 0.2;
  const drift = Math.cos(index * 1.6) * laneWidth * 0.22;
  const wobbleFreq = 1.6 + (index % 3) * 0.4;
  const wobblePhase = index * 1.7;
  const wobbleAmp = laneWidth * 0.05; // ondulação pequena — "mão trêmula", não a tira toda

  const cx = (t: number) =>
    centerX + drift * t + Math.sin(t * Math.PI * wobbleFreq + wobblePhase) * wobbleAmp * t;
  const cy = (t: number) => -height * 0.08 + height * 1.18 * t;

  const topWidth = laneWidth * (0.34 + 0.08 * Math.cos(index * 1.3));
  const bumpFreq = 6 + (index % 3); // nós/segmentos ao longo da mecha
  const bumpPhase = index * 0.8;
  // Taper geral + oscilação de largura — o "nó de corda" que aparece na
  // referência do cliente (public/imagens/exemplo-decalque02.jfif), em
  // vez de uma borda perfeitamente lisa.
  const widthAt = (t: number) =>
    topWidth *
    Math.pow(1 - t, 0.7) *
    (1 + 0.28 * Math.sin(t * bumpFreq * Math.PI * 2 + bumpPhase));

  const dt = 0.001;
  const normalAt = (t: number): Point => {
    const t1 = Math.max(t - dt, 0);
    const t2 = Math.min(t + dt, 1);
    const dx = cx(t2) - cx(t1);
    const dy = cy(t2) - cy(t1);
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  };

  const samples = 42;
  const left: Point[] = [];
  const right: Point[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const [nx, ny] = normalAt(t);
    const w = widthAt(t) / 2;
    left.push([cx(t) - nx * w, cy(t) - ny * w]);
    right.push([cx(t) + nx * w, cy(t) + ny * w]);
  }

  const rightReversed = [...right].reverse();
  const d = `${catmullRomPath(left)} ${continuePath(rightReversed)} Z`;

  return { d, cx, cy };
}

export function HairDecal({
  className,
  strandCount = 6,
  width = 1400,
  height = 300,
}: HairDecalProps) {
  const ribbons = Array.from({ length: strandCount }, (_, i) => buildRibbon(i, width, height));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {ribbons.map((ribbon, i) => {
        const isRed = i % 3 === 0;
        const fill = isRed ? "var(--color-brand-red)" : "var(--color-brand-cream)";
        const opacity = isRed ? 0.92 : 0.85;

        return (
          <motion.path
            key={i}
            d={ribbon.d}
            fill={fill}
            opacity={opacity}
            initial={{ opacity: 0, scale: 0.85, y: -14 }}
            animate={{ opacity, scale: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.4 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ transformOrigin: "50% 0%" }}
          />
        );
      })}
    </svg>
  );
}
