import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Image
        src="/imagens/foto-logo-lkas.jpg"
        alt="Lkas Locs"
        width={120}
        height={120}
        priority
        className="rounded-full"
      />
      <div>
        <h1 className="text-2xl font-bold text-brand-black">
          Lkas <span className="text-brand-red">Locs</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Site em construção — Fase 0: fundação do projeto.
        </p>
      </div>
    </main>
  );
}
