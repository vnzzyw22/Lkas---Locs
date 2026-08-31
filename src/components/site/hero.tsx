import Image from "next/image";
import { getWhatsappLink } from "@/lib/whatsapp";

interface HeroProps {
  whatsapp: string | null;
}

export function Hero({ whatsapp }: HeroProps) {
  const whatsappLink = getWhatsappLink(
    whatsapp,
    "Olá! Vim pelo site e gostaria de agendar um horário na Lkas Locs.",
  );

  return (
    <section
      id="topo"
      className="relative flex flex-col items-center gap-8 overflow-hidden bg-brand-black px-6 py-20 text-center text-white"
    >
      <Image
        src="/imagens/foto-logo-lkas.jpg"
        alt="Lkas Locs"
        width={96}
        height={96}
        priority
        className="rounded-full ring-4 ring-brand-red"
      />

      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold sm:text-5xl">
          Lkas <span className="text-brand-red">Locs</span>
        </h1>
        <p className="mx-auto max-w-md text-neutral-300">
          Locs, tranças, twists e cuidados capilares em Maringá — PR.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={whatsappLink ?? "#contato"}
          target={whatsappLink ? "_blank" : undefined}
          rel={whatsappLink ? "noopener noreferrer" : undefined}
          className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold transition hover:opacity-90"
        >
          Agendar horário
        </a>
        <a
          href="#servicos"
          className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Ver serviços
        </a>
      </div>
    </section>
  );
}
