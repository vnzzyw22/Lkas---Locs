import Image from "next/image";
import { Reveal } from "./reveal";
import { RotatingSeal } from "./rotating-seal";

// Reconstrução editorial (2026-09-03), a pedido do cliente — a versão
// anterior (bloco centralizado, texto genérico) lembrava seção
// institucional de site de salão comum. Agora ecoa deliberadamente o
// wordmark da Hero ("LKAS" preenchido em vermelho / "LOCS" só contorno
// em creme, ver hero.tsx) — o fechamento da página cita a abertura, em
// escala menor. Acento ao lado de "LOCS" era o decalque de cabelo
// (decal-locs-01.png, igual à Hero); trocado por um medalhão com a logo
// real da marca (ver comentário mais abaixo) — pedido do cliente pra essa
// seção especificamente, não mudou o decalque da Hero. Fundo escuro
// (`bg-brand-ink`) — a seção faz a transição do bloco claro
// (Serviços/Galeria) pro fechamento escuro da página (FAQ claro, Contato
// + Rodapé escuros, ver DESIGN.md).
export function AboutSection() {
  return (
    <section
      id="sobre"
      className="relative overflow-hidden bg-brand-ink px-6 py-24 lg:py-32"
    >
      <Image
        src="/imagens/decal-locs-02.png"
        alt=""
        aria-hidden="true"
        width={926}
        height={751}
        className="pointer-events-none absolute -right-32 -bottom-24 w-[70vw] max-w-[820px] min-w-[420px] rotate-6 opacity-[0.06]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <div className="relative">
            <h2 className="font-display text-4xl leading-[0.92] font-black uppercase sm:text-5xl lg:text-6xl">
              <span
                className="block text-transparent"
                style={{ WebkitTextStroke: "1.5px var(--color-brand-cream)" }}
              >
                Sobre o
              </span>
              <span className="block text-brand-red">Lkas</span>
              <span
                className="block text-transparent"
                style={{ WebkitTextStroke: "1.5px var(--color-brand-cream)" }}
              >
                Locs
              </span>
            </h2>

            {/* Medalhão com a logo real (2026-09-03), a pedido do cliente —
                substitui o acento de decalque de cabelo que ficava aqui:
                "é a seção que fala sobre ele, então fica justo aparecer a
                logo". `foto-logo-lkas.jpg` é 150×150 com fundo branco sólido
                (ver PRODUCT.md > Brand Commitments) — o recorte circular
                (`rounded-full`) corta as bordas brancas do quadrado. Anel
                vermelho sólido colado na logo (fixo, não gira) + selo de
                texto giratório por fora (`RotatingSeal`, ver
                rotating-seal.tsx) dão o acabamento de selo/medalha em vez
                de só colar o quadrado branco no fundo escuro. Logo em
                tamanho perto do nativo (150px) pra não ampliar e borrar
                uma imagem que já é baixa-resolução. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -right-6 hidden -translate-y-1/2 -rotate-6 sm:block lg:-right-10"
            >
              <div className="relative h-24 w-24 lg:h-32 lg:w-32">
                <div className="absolute -inset-7 lg:-inset-9">
                  <RotatingSeal />
                </div>
                <div className="relative z-10 h-full w-full overflow-hidden rounded-full shadow-lg shadow-black/50 ring-2 ring-brand-red">
                  <Image
                    src="/imagens/foto-logo-lkas.jpg"
                    alt=""
                    width={150}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal
          delay={0.1}
          className="flex flex-col gap-6 border-brand-cream/15 lg:col-span-6 lg:col-start-7 lg:border-l lg:pl-10"
        >
          <p className="max-w-md font-light text-base text-brand-cream/90 sm:text-lg">
            O Lkas Locs nasceu para valorizar a identidade, o estilo e a
            liberdade de quem escolhe viver sua jornada com locs.
          </p>
          <p className="max-w-md font-light text-brand-smoke">
            Mais do que um cuidado com o cabelo, cada atendimento é pensado
            para respeitar a individualidade, a textura e o momento de cada
            pessoa.
          </p>
          <p className="max-w-md font-light text-brand-smoke">
            Da criação dos Starter Locs à manutenção e aos diferentes
            estilos, o objetivo é entregar um trabalho cuidadoso, autêntico e
            alinhado com quem você é.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
