import { Reveal } from "./reveal";

export function AboutSection() {
  return (
    <section id="sobre" className="mx-auto max-w-3xl px-6 py-24 text-center">
      <Reveal>
        <h2 className="font-display text-2xl font-bold text-brand-cream sm:text-3xl">
          Sobre a <span className="text-brand-red">Lkas Locs</span>
        </h2>
        <p className="mt-6 text-brand-smoke">
          Cuidado especializado em locs, tranças, twists e saúde capilar em
          Maringá — PR. Cada atendimento é pensado para valorizar sua
          identidade e manter o seu cabelo saudável, com técnica e atenção
          aos detalhes.
        </p>
      </Reveal>
    </section>
  );
}
