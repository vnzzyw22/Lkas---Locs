import { FaqAccordion } from "./faq-accordion";
import { Reveal } from "./reveal";

// Nova seção (2026-09-03), a pedido do cliente — título em Sora
// (`font-heading-soft`, ver layout.tsx) em vez de Unbounded: o cliente
// gostou do gesto visual das outras seções mas pediu uma fonte "do mesmo
// gênero, porém mais suave" só pra esse título. "Perguntas" ficou sólido,
// sem contorno/vazado nenhum — depois de várias rodadas testando efeitos
// de contorno (palavra inteira vazada, só uma letra, borda fina/grossa em
// combinações diferentes), o cliente pediu pra tirar esse efeito de vez e
// deixar só texto normal. Não reintroduzir `WebkitTextStroke`/
// `text-transparent` aqui sem pedido explícito — já foi tentado e
// rejeitado múltiplas vezes.
export function FaqSection() {
  return (
    <section id="faq" className="bg-brand-paper">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <Reveal>
          <div className="flex flex-col items-start gap-4 text-left">
            <h2 className="font-heading-soft text-4xl leading-none font-bold tracking-tight uppercase sm:text-5xl lg:text-6xl">
              <span className="text-brand-black">Perguntas</span>{" "}
              <span className="text-brand-red">Frequentes</span>
            </h2>
            <span aria-hidden="true" className="h-px w-16 bg-brand-red/60" />
            <p className="max-w-md text-neutral-500">
              Tem alguma dúvida sobre sua jornada com locs? Talvez a resposta
              esteja aqui.
            </p>
          </div>
        </Reveal>

        <FaqAccordion />

        <p className="mt-8 font-label text-xs text-neutral-400">
          As respostas acima são informações gerais sobre cuidados com locs e
          não substituem uma avaliação presencial.
        </p>
      </div>
    </section>
  );
}
