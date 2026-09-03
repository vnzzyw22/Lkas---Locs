import Image from "next/image";
import Link from "next/link";
import { getWhatsappLink } from "@/lib/whatsapp";
import type { BusinessSettings, Service } from "@/lib/supabase/types";

interface FooterProps {
  business: BusinessSettings | null;
  services: Service[];
}

const NAV_LINKS = [
  { href: "#topo", label: "Início" },
  { href: "#servicos", label: "Serviços" },
  { href: "#sobre", label: "Sobre" },
  { href: "#galeria", label: "Galeria" },
  { href: "/agendar", label: "Agendamento" },
  { href: "#faq", label: "FAQ" },
];

// Serviços em destaque no rodapé — nomes reais do seed (ver CLAUDE.md >
// "Serviços iniciais"), casados com os dados vindos do banco pra pegar o id
// de cada um. Se um nome não existir mais no banco, o link simplesmente não
// aparece (nunca inventa um serviço ou aponta pra um id que não existe).
const FOOTER_SERVICE_NAMES = ["Starter Locs", "Retwist", "Barrel", "Tranças", "Twists"];

// Reformulação completa (2026-09-03), a pedido do cliente — o rodapé
// anterior era só logo + linha + copyright, sem estrutura. Fundo escuro
// (`bg-brand-ink`, mesmo token da Hero) fecha o "sanduíche" da página
// (Hero escura abre, Rodapé escuro fecha). Dados de contato vêm só de
// `business_settings` — nunca hardcoded (WhatsApp/Instagram somem quando
// não estão cadastrados, em vez de mostrar um link falso).
export function Footer({ business, services }: FooterProps) {
  const whatsappLink = business
    ? getWhatsappLink(
        business.whatsapp,
        "Olá! Vim pelo site e gostaria de saber mais sobre a Lkas Locs.",
      )
    : null;

  const instagramHandle = business?.instagram?.replace(/^@/, "") ?? null;

  const footerServices = FOOTER_SERVICE_NAMES.map((name) =>
    services.find((service) => service.name === name),
  ).filter((service): service is Service => Boolean(service));

  return (
    <footer className="bg-brand-ink px-6 pt-20 pb-8">
      <div className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
          <Link href="#topo" className="flex items-center gap-2.5">
            <Image
              src="/imagens/foto-logo-lkas.jpg"
              alt="Lkas Locs"
              width={36}
              height={36}
              className="rounded-full ring-1 ring-white/20"
            />
            <span className="font-display text-base font-bold tracking-wide text-brand-cream">
              LKAS <span className="text-brand-red">LOCS</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm text-brand-smoke">
            Locs, cuidado e identidade.
            <br />
            Um espaço para você viver sua jornada com autenticidade.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-label text-xs tracking-widest text-brand-cream/60 uppercase">
            Contato
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm text-brand-smoke">
            {business?.address && <li>{business.address}</li>}
            {whatsappLink && (
              <li>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-red"
                >
                  WhatsApp
                </a>
              </li>
            )}
            {instagramHandle && (
              <li>
                <a
                  href={`https://instagram.com/${instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-red"
                >
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-label text-xs tracking-widest text-brand-cream/60 uppercase">
            Navegação
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm text-brand-smoke">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="transition-colors hover:text-brand-red"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {footerServices.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-label text-xs tracking-widest text-brand-cream/60 uppercase">
              Serviços
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm text-brand-smoke">
              {footerServices.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/agendar?servico=${service.id}`}
                    className="transition-colors hover:text-brand-red"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-4 border-t border-brand-cream/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-label text-xs tracking-widest text-brand-smoke uppercase">
          Lkas Locs <span className="text-brand-cream/40">·</span> ©{" "}
          {new Date().getFullYear()} — Todos os direitos reservados.
        </p>
        <div className="flex gap-6 font-label text-xs tracking-widest text-brand-smoke uppercase">
          <Link
            href="/politica-de-privacidade"
            className="transition-colors hover:text-brand-red"
          >
            Política de Privacidade
          </Link>
          <Link
            href="/termos-de-uso"
            className="transition-colors hover:text-brand-red"
          >
            Termos de Uso
          </Link>
        </div>
      </div>
    </footer>
  );
}
