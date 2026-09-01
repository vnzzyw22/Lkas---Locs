import Link from "next/link";
import { formatDuration, formatPrice } from "@/lib/format";
import { Reveal } from "./reveal";
import type { Service } from "@/lib/supabase/types";

interface ServicesSectionProps {
  services: Service[];
}

// Fundo claro (cliente preferiu manter — testou a versão escura e não
// gostou). Cards vazados (sem cor de fundo própria, só borda vermelha
// fina, cantos retos) em vez da caixa branca arredondada anterior:
// combina com o traço fino dos decalques já usados na Hero. Grade
// perfeitamente alinhada — o escalonamento entre cards foi testado e
// removido a pedido do cliente ("ficou torto").
export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="servicos" className="mx-auto max-w-5xl px-6 py-24 lg:max-w-6xl">
      <Reveal>
        <h2 className="text-center font-display text-2xl font-bold text-brand-black sm:text-3xl">
          Nossos <span className="text-brand-red">Serviços</span>
        </h2>
      </Reveal>

      {services.length === 0 ? (
        <p className="mt-8 text-center text-neutral-500">
          Serviços em breve.
        </p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={(i % 3) * 0.08}>
              <article className="flex h-full flex-col gap-2 border border-brand-red/40 p-5 transition hover:border-brand-red lg:gap-3 lg:p-8">
                <h3 className="font-display text-lg font-bold text-brand-black lg:text-xl">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm text-neutral-500 lg:text-base">
                    {service.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-3 text-sm lg:text-base">
                  <span className="font-bold text-brand-red">
                    {formatPrice(service.price)}
                  </span>
                  <span className="text-neutral-500">
                    {formatDuration(service.duration_minutes)}
                  </span>
                </div>
                <Link
                  href={`/agendar?servico=${service.id}`}
                  className="mt-2 bg-brand-red px-4 py-2 text-center font-label text-xs font-medium tracking-widest text-white uppercase transition hover:opacity-90 lg:px-5 lg:py-3 lg:text-sm"
                >
                  Agendar
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
