"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 639px)";
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

// Vídeo de fundo exclusivo do Hero MOBILE — o Hero desktop nunca renderiza
// este elemento (ver hero.tsx, que só monta este componente dentro do
// wrapper de background já existente, atrás do glow radial/decalque). A
// checagem de largura acontece em JS (matchMedia), não só via classe
// `sm:hidden`: um <video> presente no DOM mas escondido por CSS ainda pode
// disparar download no desktop dependendo do navegador/preload — só
// existir no DOM abaixo do breakpoint garante que o arquivo (~4.4MB) nunca
// é buscado em telas maiores. `prefers-reduced-motion` corta o vídeo por
// completo: o fundo escuro (`bg-brand-ink`) + glow oxblood já existentes na
// Hero (ver hero.tsx) já servem como experiência estática adequada, sem
// precisar de um segundo fallback.
export function HeroMobileVideoBackground() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const reduceMotion = useMediaQuery(REDUCE_MOTION_QUERY);
  const videoRef = useRef<HTMLVideoElement>(null);

  // O <video> só existe no DOM depois da hidratação (isMobile começa em
  // `false` no servidor, ver useMediaQuery acima) — ele nunca faz parte do
  // HTML já interpretado pelo navegador, é inserido pelo React. Nesse
  // cenário o atributo `autoPlay` sozinho é frágil: o React pode chamar
  // play() antes do elemento processar o <source>/iniciar a seleção de
  // mídia, e a prop `muted` do React nem sempre mantém a propriedade
  // `.muted` real sincronizada no momento exato do play() — que é
  // justamente o que a política de autoplay do Chrome verifica. Por isso
  // a inicialização é reforçada aqui: muted setado explicitamente antes de
  // qualquer play(), e o play() só é chamado quando o vídeo já tem dado
  // suficiente (`readyState >= 3`) ou, se ainda não tiver, assim que os
  // eventos `loadedmetadata`/`canplay` disparam.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, [isMobile, reduceMotion]);

  if (!isMobile || reduceMotion) return null;

  return (
    <div className="absolute inset-0 sm:hidden">
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
