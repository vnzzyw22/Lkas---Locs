"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";

interface FaqEntry {
  question: string;
  answer: string;
}

// Perguntas recorrentes de quem está começando ou mantendo locs — texto
// fornecido pelo cliente (2026-09-03), tratado como informação geral, não
// diagnóstico (ver aviso abaixo do accordion). Não inventar respostas novas
// aqui sem o mesmo cuidado de não prometer resultado individual.
const FAQS: FaqEntry[] = [
  {
    question: "Com que frequência devo fazer o retwist?",
    answer:
      "Em geral, o retwist costuma ser feito a cada 4 a 6 semanas, mas o intervalo ideal depende do crescimento do cabelo, da estrutura dos locs e do resultado que você busca. Retwistar com muita frequência ou com muita tensão pode enfraquecer a raiz.",
  },
  {
    question: "Posso lavar meus locs?",
    answer:
      "Sim. A higiene do couro cabeludo e dos locs é importante. O cuidado deve ser adaptado ao estágio dos seus locs e ao método utilizado para iniciá-los. Nos Starter Locs, é importante ter mais cuidado porque pode acontecer algum desmanche durante a lavagem.",
  },
  {
    question: "É normal meus locs ficarem com frizz?",
    answer:
      "Sim. O frizz faz parte do processo dos locs e pode aparecer principalmente durante as fases iniciais. A quantidade varia de acordo com a textura do cabelo, crescimento e estágio dos locs.",
  },
  {
    question: "Starter Locs podem ser feitos em cabelo curto?",
    answer:
      "Em muitos casos, sim. O comprimento necessário pode variar de acordo com o método escolhido e com as características do cabelo. Durante a avaliação, é possível entender qual técnica faz mais sentido para o seu cabelo.",
  },
  {
    question: "Quanto tempo leva para o cabelo formar os locs?",
    answer:
      "Não existe um prazo único. O processo varia bastante de acordo com a textura, densidade, método utilizado e cuidados durante a jornada. Starter Locs passam por diferentes fases até adquirirem a aparência e a estrutura de locs maduros.",
  },
  {
    question: "Como devo cuidar dos meus locs no dia a dia?",
    answer:
      "Manter o couro cabeludo limpo, evitar excesso de produtos pesados, manter a hidratação adequada e proteger os locs durante o sono são alguns cuidados importantes. O ideal é adaptar a rotina às características do seu cabelo e ao estágio dos locs.",
  },
  {
    question: "O retwist faz o cabelo crescer mais rápido?",
    answer:
      "Não. O crescimento acontece a partir do couro cabeludo. O retwist serve principalmente para organizar e manter a aparência dos locs e das raízes.",
  },
  {
    question: "Por que meus locs estão diferentes dos de outras pessoas?",
    answer:
      "Cada jornada é diferente. Textura, densidade, espessura, método utilizado, quantidade de cabelo e rotina de manutenção influenciam diretamente no formato e na evolução dos locs.",
  },
];

function PlusMinusIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-4 w-4 shrink-0 items-center justify-center"
    >
      <span className="absolute h-px w-4 bg-brand-red" />
      <span
        className={`absolute h-4 w-px bg-brand-red transition-transform duration-300 motion-reduce:transition-none ${
          open ? "rotate-90 scale-y-0" : "rotate-0 scale-y-100"
        }`}
      />
    </span>
  );
}

function FaqItem({ entry, isOpen, onToggle }: {
  entry: FaqEntry;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();

  return (
    <div className="border-b border-brand-black/10">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="group flex w-full items-center justify-between gap-6 py-6 text-left"
        >
          <span className="font-display text-base font-bold tracking-tight text-brand-black uppercase transition-colors group-hover:text-brand-red sm:text-lg">
            {entry.question}
          </span>
          <PlusMinusIcon open={isOpen} />
        </button>
      </h3>
      <motion.div
        id={panelId}
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
        aria-hidden={!isOpen}
      >
        <p className="max-w-2xl pr-10 pb-6 text-neutral-500">
          {entry.answer}
        </p>
      </motion.div>
    </div>
  );
}

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-14 border-t border-brand-black/10">
      {FAQS.map((entry, i) => (
        <FaqItem
          key={entry.question}
          entry={entry}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex((current) => (current === i ? null : i))}
        />
      ))}
    </div>
  );
}
