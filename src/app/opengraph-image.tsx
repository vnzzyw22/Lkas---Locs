import { ImageResponse } from "next/og";

export const alt = "Lkas Locs — Locs, tranças, twists e barbearia em Maringá, PR";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Prévia de compartilhamento (WhatsApp/Instagram/etc.) gerada em código, sem
// depender de nenhum arquivo estático — estático e cacheado no build (não
// busca nada do banco), então não pesa nada em cada compartilhamento. Cores
// literais (não dá pra usar var(--color-brand-*) aqui, o Satori não lê CSS
// externo) copiadas de globals.css.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0d0b0a",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#a89f92",
            marginBottom: 24,
          }}
        >
          Locs · Tranças · Twists
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 160,
            fontWeight: 900,
            lineHeight: 0.9,
            color: "#c8102e",
          }}
        >
          LKAS
        </div>
        {/* Satori (motor por trás do ImageResponse) não suporta
            WebkitTextStroke — um contorno vazado como no wordmark do site
            simplesmente não renderiza (texto some, fica invisível). Sólido
            aqui em vez de tentar replicar o efeito da Hero. */}
        <div
          style={{
            display: "flex",
            fontSize: 160,
            fontWeight: 900,
            lineHeight: 0.9,
            color: "#f3ede3",
          }}
        >
          LOCS
        </div>
        <div
          style={{
            fontSize: 24,
            letterSpacing: 2,
            color: "#a89f92",
            marginTop: 40,
          }}
        >
          Maringá — PR
        </div>
      </div>
    ),
    { ...size },
  );
}
