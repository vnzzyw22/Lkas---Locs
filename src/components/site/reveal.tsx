"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Entrada suave ao rolar até a seção — usada nas seções abaixo da Hero
// pra dar continuidade ao "sensação de movimento" pedido no brief sem
// reescrever a estrutura de cada seção (isso é Fase 6/redesign, não
// Fase 5). Ao contrário do decalque da Hero, aqui faz sentido animar
// por scroll: essas seções realmente começam fora da viewport inicial.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
