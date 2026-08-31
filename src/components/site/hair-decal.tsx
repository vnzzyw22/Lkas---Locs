"use client";

import { motion } from "framer-motion";

// Decalque desenhado à mão (street/fashion sketch) de locs/twists —
// nunca rosto, personagem ou clipart, ver PRODUCT.md > Brand Commitments.
//
// v4: composição compacta em "coroa" (as mechas nascem de uma região
// estreita no topo e se abrem em leque ao descer, com comprimentos
// variados) em vez da faixa espalhada pela largura toda da v3 — o
// cliente pediu essa composição menor, ancorada ao lado do wordmark, ver
// public/imagens/posição-que-deve-ficar-os-decalques-que-eu-adicionei.png.
// Cada mecha continua sendo uma "fita" preenchida (silhueta) com
// afunilamento e textura em nós ao longo do comprimento — técnica
// mantida da v3, que já bateu com a referência do cliente
// (public/imagens/exemplo-decalque*.png/jfif). Geradas parametricamente,
// determinístico por índice (sem Math.random, pra não divergir entre
// SSR e cliente). Entrada via framer-motion (fade + leve escala).

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

function buildLoc(index: number, count: number, width: number, height: number) {
  const spread = count > 1 ? (index - (count - 1) / 2) / ((count - 1) / 2) : 0; // -1..1

  const crownX = width * 0.5;
  const crownY = height * 0.02;
  const startX = crownX + spread * width * 0.1 + Math.sin(index * 1.9) * width * 0.015;
  const endXOffset = spread * width * 0.4 + Math.sin(index * 2.7) * width * 0.04;
  const lengthFactor = 0.6 + 0.36 * ((Math.sin(index * 1.35) + 1) / 2);
  const endY = height * lengthFactor;

  const wobbleFreq = 2 + (index % 3);
  const wobblePhase = index * 1.7;
  const wobbleAmp = width * 0.018;

  const cx = (t: number) =>
    startX +
    endXOffset * Math.pow(t, 0.8) +
    Math.sin(t * Math.PI * wobbleFreq + wobblePhase) * wobbleAmp * t;
  const cy = (t: number) => crownY + (endY - crownY) * t;

  const topWidth = width * (0.1 + 0.02 * Math.cos(index * 1.3));
  const bumpFreq = 6 + (index % 3); // nós/segmentos ao longo da mecha
  const bumpPhase = index * 0.8;
  const widthAt = (t: number) =>
    topWidth *
    Math.pow(1 - t, 0.65) *
    (1 + 0.26 * Math.sin(t * bumpFreq * Math.PI * 2 + bumpPhase));

  const dt = 0.001;
  const normalAt = (t: number): Point => {
    const t1 = Math.max(t - dt, 0);
    const t2 = Math.min(t + dt, 1);
    const dx = cx(t2) - cx(t1);
    const dy = cy(t2) - cy(t1);
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  };

  const samples = 40;
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

  return d;
}

export function HairDecal({
  className,
  strandCount = 9,
  width = 520,
  height = 560,
}: HairDecalProps) {
  const locs = Array.from({ length: strandCount }, (_, i) =>
    buildLoc(i, strandCount, width, height),
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="xMidYMin meet"
      aria-hidden="true"
    >
      {locs.map((d, i) => {
        const isRed = i % 3 === 0;
        const fill = isRed ? "var(--color-brand-red)" : "var(--color-brand-cream)";
        const opacity = isRed ? 0.92 : 0.85;

        return (
          <motion.path
            key={i}
            d={d}
            fill={fill}
            opacity={opacity}
            initial={{ opacity: 0, scale: 0.85, y: -14 }}
            animate={{ opacity, scale: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.4 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ transformOrigin: "50% 0%" }}
          />
        );
      })}
    </svg>
  );
}
