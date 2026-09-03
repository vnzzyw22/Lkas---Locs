import Image from "next/image";
import Link from "next/link";
import { formatDuration, formatPrice } from "@/lib/format";
import { Reveal } from "./reveal";
import type { Service } from "@/lib/supabase/types";

interface ServicesSectionProps {
  services: Service[];
}

// Foto de fundo só no primeiro serviço (posição 0 — o cliente vai
// deixar o mais vendido em primeiro via `display_order` no admin).
// Mesmo tratamento "card com foto de fundo + véu escuro" testado
// antes em 2 cards por nome; agora fixo só no card de abertura,
// independente do nome do serviço.
const LEAD_PHOTO = "/imagens/foto-tranças-1.jpg";

// Redesenho editorial (2026-09-02), a pedido do cliente — a versão
// anterior (cards com borda vermelha + botão sólido) lembrava tabela/
// dashboard, sem relação com a Hero. Sem fotos por decisão explícita
// (testar a seção só com tipografia/composição primeiro). Mantém o
// mesmo sistema tipográfico do resto do site (Unbounded/font-display,
// JetBrains Mono/font-label) por coerência de marca — o problema
// nunca foi a família da fonte, era a escala/peso tímidos e a caixa
// genérica em volta de cada serviço.
//
// Assimetria: o primeiro serviço vira uma "abertura" em largura
// cheia com tipografia bem maior (mesmo gesto editorial da Hero,
// versão contida); os demais seguem em grade, sem caixa/borda,
// separados só por espaço negativo generoso. O numeral de cada item
// é decorativo (`aria-hidden`) — a ordem real já vem da hierarquia de
// heading.
export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="servicos" className="bg-brand-paper">
      <div className="mx-auto max-w-5xl px-6 py-24 lg:max-w-6xl">
      <Reveal>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-center font-display text-4xl leading-none font-black tracking-tight uppercase sm:text-5xl lg:text-6xl">
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "1.5px var(--color-brand-black)" }}
            >
              Nossos
            </span>{" "}
            <span className="text-brand-red">Serviços</span>
          </h2>
          <span aria-hidden="true" className="h-px w-16 bg-brand-red/60" />
        </div>
      </Reveal>

      {services.length === 0 ? (
        <p className="mt-8 text-center text-neutral-500">
          Serviços em breve.
        </p>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-20">
          {services.map((service, i) => {
            const isLead = i === 0;
            const index = String(i + 1).padStart(2, "0");
            const tiltRight = i % 2 === 1;

            return (
              <Reveal
                key={service.id}
                delay={Math.min(i, 3) * 0.07}
                className={isLead ? "sm:col-span-2 lg:col-span-3" : undefined}
              >
                <article
                  className={
                    isLead
                      ? "relative flex min-h-[160px] flex-col justify-end gap-6 overflow-hidden rounded-xl p-8 text-brand-cream sm:min-h-[190px] sm:rounded-2xl sm:p-10 lg:min-h-[220px] lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:rounded-3xl lg:p-12"
                      : "flex flex-col border-t border-brand-black/10 pt-6"
                  }
                >
                  {isLead && (
                    <>
                      <Image
                        src={LEAD_PHOTO}
                        alt={service.name}
                        fill
                        sizes="(min-width: 1024px) 1100px, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/70 to-brand-ink/20" />
                    </>
                  )}

                  <div className="relative z-10">
                    <span
                      aria-hidden="true"
                      className={`block font-display leading-none font-black select-none ${
                        isLead
                          ? "text-5xl text-brand-cream/20 lg:text-7xl"
                          : `text-4xl text-brand-black/10 lg:text-5xl ${tiltRight ? "rotate-1" : "-rotate-1"}`
                      }`}
                    >
                      {index}
                    </span>
                    <h3
                      className={`font-display font-black tracking-tight uppercase ${
                        isLead
                          ? "-mt-3 text-4xl sm:text-5xl lg:-mt-5 lg:text-6xl xl:text-7xl"
                          : "-mt-2 text-xl text-brand-black lg:text-2xl"
                      }`}
                    >
                      {service.name}
                    </h3>
                    {service.description && (
                      <p
                        className={
                          isLead
                            ? "mt-3 max-w-md text-sm text-brand-cream/80 lg:text-base"
                            : "mt-2 max-w-xs text-sm text-neutral-500"
                        }
                      >
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div
                    className={
                      isLead
                        ? "relative z-10 flex shrink-0 flex-col items-start gap-4 lg:items-end"
                        : "relative z-10 mt-5 flex flex-col gap-4"
                    }
                  >
                    <div
                      className={`flex items-baseline gap-4 ${isLead ? "" : "w-full justify-between"}`}
                    >
                      <span
                        className={`font-display font-bold text-brand-red ${
                          isLead ? "text-3xl lg:text-4xl" : "text-xl lg:text-2xl"
                        }`}
                      >
                        {formatPrice(service.price)}
                      </span>
                      <span
                        className={`font-label text-xs tracking-widest uppercase ${
                          isLead ? "text-brand-cream/70" : "text-neutral-500"
                        }`}
                      >
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </div>

                    <Link
                      href={`/agendar?servico=${service.id}`}
                      className={`group/cta relative inline-flex w-fit items-center gap-2 font-label text-xs font-medium tracking-widest uppercase transition-colors motion-reduce:transition-none ${
                        isLead
                          ? "text-brand-cream hover:text-brand-red"
                          : "text-brand-black hover:text-brand-red"
                      }`}
                    >
                      Agendar
                      <span className="transition-transform duration-300 group-hover/cta:translate-x-1 motion-reduce:transition-none">
                        →
                      </span>
                      <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brand-red transition-transform duration-300 group-hover/cta:scale-x-100 motion-reduce:transition-none" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
      </div>
    </section>
  );
}
