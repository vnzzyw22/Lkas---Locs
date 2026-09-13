import type { NextConfig } from "next";

// Hostname derivado da env (não hardcoded): este é um template clonado por
// cliente, cada deployment aponta pra um projeto Supabase diferente.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Fase 6 (brand-outro): browser real do cliente pediu esse mesmo vídeo
  // sem a extensão .mp4 e recebia 404 — nunca reproduzido via curl, só no
  // navegador dele, causa exata não identificada. Rewrite defensivo mantido
  // como rede de segurança pro vídeo de fundo da Hero.
  async rewrites() {
    return [
      {
        source: "/imagens/video-marca-lkas",
        destination: "/imagens/video-marca-lkas.mp4",
      },
    ];
  },
  // Server Actions (usado no upload de foto da Galeria) limitam o corpo da
  // requisição a 1MB por padrão — menor que o limite de 5MB que o próprio
  // formulário anuncia (src/app/admin/(painel)/galeria/actions.ts). Sem
  // isso, uma foto "normal" de celular (facilmente >1MB) é rejeitada pelo
  // Next.js antes do nosso código rodar, e o botão trava em "Enviando...".
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
