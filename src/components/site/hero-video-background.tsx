"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// useSyncExternalStore em vez de useState+useEffect: é o jeito idiomático
// do React de sincronizar com uma API externa (matchMedia) sem risco de
// mismatch de hidratação (getServerSnapshot fixo em `false`, igual ao que o
// servidor renderiza) nem setState síncrono dentro de efeito.
function subscribe(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Vídeo de fundo da Hero — mobile e desktop (nasceu só mobile, ver
// CLAUDE.md > Fase 6, generalizado depois a pedido do cliente pra usar o
// mesmo vídeo no notebook). `prefers-reduced-motion` corta o vídeo por
// completo: o fundo escuro (`bg-brand-ink`) + glow oxblood já existentes na
// Hero (ver hero.tsx) já servem como experiência estática adequada, sem
// precisar de um segundo fallback.
export function HeroVideoBackground() {
  const reduceMotion = useMediaQuery(REDUCE_MOTION_QUERY);
  const videoRef = useRef<HTMLVideoElement>(null);

  // O atributo `autoPlay` sozinho é frágil aqui: a política de autoplay do
  // Chrome verifica o estado real de `.muted` no exato momento do play(), e
  // a prop `muted` do React nem sempre está sincronizada a tempo. Por isso
  // a inicialização é reforçada: muted setado explicitamente antes de
  // qualquer play(), chamado assim que o vídeo já tem dado suficiente
  // (`readyState >= 3`) ou, se ainda não tiver, quando `loadedmetadata`/
  // `canplay` dispararem.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;

    video.muted = true;

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // autoplay bloqueado/interrompido pelo navegador (ex.: troca de
          // aba durante o carregamento) — comportamento esperado, não é
          // uma falha da aplicação, não precisa virar erro no console.
        });
      }
    };

    if (video.readyState >= 3) {
      tryPlay();
    } else {
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
      video.addEventListener("canplay", tryPlay, { once: true });
    }

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        src="/videos/lkas-hero-mobile.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          // força a promoção do <video> pra própria camada de composição
          // via GPU explicitamente — padrão conhecido de correção para o
          // caso "toca normalmente pela API mas pinta preto na tela" no
          // Chrome, quando a heurística automática do navegador não
          // promove o vídeo sozinha (varia por GPU/driver).
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      />
      {/* overlay escuro: o vídeo tem movimento rápido e mudança de cor —
          sem isso o texto/CTA em cima perdem legibilidade. 60% (não mais
          opaco) porque em /80 o vídeo ficava indistinguível de fundo sólido
          preto — medido por amostragem de pixel real, não só no olho (ver
          conversa: brilho médio da faixa visível do vídeo varia de ~250,
          quase-branco, a ~30-90 em cores escuras; em /80 mesmo os picos
          claros compunham pra perto do preto puro). */}
      <div className="absolute inset-0 bg-brand-ink/60" />
    </div>
  );
}
