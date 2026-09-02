import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-12 text-center">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Image
            src="/imagens/foto-logo-lkas.jpg"
            alt="Lkas Locs"
            width={28}
            height={28}
            className="rounded-full ring-1 ring-white/20"
          />
          <span className="font-display text-sm font-bold tracking-wide text-brand-cream">
            LKAS <span className="text-brand-red">LOCS</span>
          </span>
        </div>
        <span aria-hidden="true" className="h-px w-16 bg-brand-red/60" />
        <p className="font-label text-xs tracking-wide text-brand-smoke">
          © {new Date().getFullYear()} Lkas Locs — Maringá, PR
        </p>
      </div>
    </footer>
  );
}
