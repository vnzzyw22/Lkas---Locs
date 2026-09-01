import { formatBusinessHours } from "@/lib/business-hours";
import { getWhatsappLink } from "@/lib/whatsapp";
import { Reveal } from "./reveal";
import type { BusinessSettings } from "@/lib/supabase/types";

interface ContactSectionProps {
  business: BusinessSettings | null;
}

export function ContactSection({ business }: ContactSectionProps) {
  const whatsappLink = business
    ? getWhatsappLink(
        business.whatsapp,
        "Olá! Vim pelo site e gostaria de agendar um horário na Lkas Locs.",
      )
    : null;

  const hours = business ? formatBusinessHours(business.business_hours) : [];

  return (
    <section
      id="contato"
      className="mx-auto grid max-w-5xl gap-10 px-6 py-24 sm:grid-cols-2"
    >
      <Reveal>
        <h2 className="font-display text-2xl font-bold text-brand-cream sm:text-3xl">
          Contato
        </h2>

        <ul className="mt-6 flex flex-col gap-3 text-brand-smoke">
          {business?.address && <li>{business.address}</li>}

          {whatsappLink && (
            <li>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-red hover:underline"
              >
                Falar no WhatsApp
              </a>
            </li>
          )}

          {business?.instagram && (
            <li>
              <a
                href={`https://instagram.com/${business.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-red hover:underline"
              >
                @{business.instagram.replace(/^@/, "")}
              </a>
            </li>
          )}
        </ul>
      </Reveal>

      {hours.length > 0 && (
        <Reveal delay={0.1}>
          <h3 className="font-display font-semibold text-brand-cream">
            Horário de funcionamento
          </h3>
          <dl className="mt-4 flex flex-col gap-1 font-label text-sm text-brand-smoke">
            {hours.map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      )}
    </section>
  );
}
