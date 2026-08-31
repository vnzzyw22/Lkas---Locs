import Link from "next/link";
import { formatDuration, formatPrice } from "@/lib/format";
import { Reveal } from "./reveal";
import type { Service } from "@/lib/supabase/types";

interface ServicesSectionProps {
  services: Service[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="servicos" className="mx-auto max-w-5xl px-6 py-24">
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
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={(i % 3) * 0.08}>
              <article className="flex h-full flex-col gap-2 rounded-xl border border-black/5 p-5 shadow-sm transition hover:shadow-md">
                <h3 className="font-semibold text-brand-black">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm text-neutral-500">
                    {service.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-3 text-sm">
                  <span className="font-bold text-brand-red">
                    {formatPrice(service.price)}
                  </span>
                  <span className="text-neutral-500">
                    {formatDuration(service.duration_minutes)}
                  </span>
                </div>
                <Link
                  href={`/agendar?servico=${service.id}`}
                  className="mt-2 rounded-full border border-brand-red px-4 py-2 text-center font-label text-xs tracking-widest text-brand-red uppercase transition hover:bg-brand-red hover:text-white"
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
