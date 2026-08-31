"use client";

import { motion } from "framer-motion";

// Decalque desenhado à mão (street/fashion sketch) de locs/tranças —
// nunca rosto, personagem ou clipart, ver PRODUCT.md > Brand Commitments.
// As tiras são geradas parametricamente (Catmull-Rom por cima de uma onda
// senoidal com envelope, determinístico por índice — sem Math.random, pra
// não divergir entre render de servidor e cliente) e "desenhadas" via
// framer-motion pathLength ao montar (a Hero inteira, decalque incluído,
// já é a primeira viewport — não faz sentido animar por scroll aqui),
// imitando um rabisco sendo traçado à mão.

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

function strandCurve(x: (t: number) => number, y: (t: number) => number, samples: number) {
  const points: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    points.push([x(t), y(t)]);
  }
  return points;
}

function buildStrand(index: number, width: number, height: number) {
  const lane = width / 6.2;
  const baseX = lane * (index + 0.7) + Math.sin(index * 2.399) * lane * 0.28;
  const amplitude = lane * (0.32 + 0.1 * Math.cos(index * 1.7));
  const freq = 1.1 + (index % 3) * 0.3;
  const phase = index * 2.399;
  const drift = Math.sin(index * 1.1) * lane * 0.22;

  // Envelope cresce de 0 (topo, quase reto — é a parte que fica visível
  // dentro da viewport) até o máximo perto da base (que sangra pra fora
  // da Hero) — evita o efeito "arco" logo no início da tira.
  const x = (t: number) =>
    baseX + drift * t + Math.sin(t * Math.PI * freq + phase) * amplitude * Math.pow(t, 1.4);
  const y = (t: number) => -height * 0.1 + height * 1.22 * t;

  const points = strandCurve(x, y, 10);
  return { path: catmullRomPath(points), x, y };
}

function buildTicks(x: (t: number) => number, y: (t: number) => number, index: number) {
  const ticks: { d: string }[] = [];
  const positions = [0.18, 0.34, 0.5, 0.66, 0.82];
  const dt = 0.01;

  positions.forEach((t, i) => {
    const px = x(t);
    const py = y(t);
    const dx = x(t + dt) - x(t - dt);
    const dy = y(t + dt) - y(t - dt);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const tickLen = 9 + ((index + i) % 3) * 2;
    const side = (index + i) % 2 === 0 ? 1 : -1;
    const x1 = px - nx * tickLen * side * 0.3;
    const y1 = py - ny * tickLen * side * 0.3;
    const x2 = px + nx * tickLen * side;
    const y2 = py + ny * tickLen * side + tickLen * 0.4;
    ticks.push({ d: `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}` });
  });

  return ticks;
}

export function HairDecal({
  className,
  strandCount = 7,
  width = 1400,
  height = 260,
}: HairDecalProps) {
  const strands = Array.from({ length: strandCount }, (_, i) => buildStrand(i, width, height));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {strands.map((strand, i) => (
        <g key={i}>
          <motion.path
            d={strand.path}
            stroke={i % 3 === 0 ? "var(--color-brand-red)" : "var(--color-brand-cream)"}
            strokeWidth={i % 3 === 0 ? 3 : 2}
            strokeLinecap="round"
            opacity={i % 3 === 0 ? 0.9 : 0.45}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          />
          {buildTicks(strand.x, strand.y, i).map((tick, j) => (
            <motion.path
              key={j}
              d={tick.d}
              stroke={i % 3 === 0 ? "var(--color-brand-red)" : "var(--color-brand-cream)"}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={i % 3 === 0 ? 0.7 : 0.35}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: i % 3 === 0 ? 0.7 : 0.35,
              }}
              transition={{
                duration: 0.4,
                delay: 0.4 + i * 0.1 + 0.6 + j * 0.05,
                ease: "easeOut",
              }}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
