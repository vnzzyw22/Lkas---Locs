---
name: Lkas Locs
description: Salão de locs/tranças/twists em Maringá — identidade premium, street, editorial e fashion.
colors:
  brand-red: "#c8102e"
  brand-black: "#111111"
  brand-ink: "#0d0b0a"
  brand-cream: "#f3ede3"
  brand-oxblood: "#4a1116"
  brand-smoke: "#9c948b"
typography:
  display:
    fontFamily: "Unbounded, ui-sans-serif, system-ui"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontWeight: 400
    letterSpacing: "0.25em"
rounded:
  pill: "9999px"
  card: "0.75rem"
  none: "0px"
components:
  button-primary:
    backgroundColor: "{colors.brand-red}"
    textColor: "{colors.brand-cream}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.brand-red}"
  cta-hero:
    backgroundColor: "{colors.brand-cream}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  cta-hero-hover:
    backgroundColor: "{colors.brand-red}"
    textColor: "{colors.brand-cream}"
---

# Design System: Lkas Locs

## Overview

**Creative North Star: "A editorial de moda que também trança cabelo"**

Lkas Locs recusa o template padrão de salão/barbearia (headshot centralizado,
gradiente pastel suave, cards arredondados, banner genérico "agende já").
Em vez disso, a Hero se comporta como a abertura de uma revista de moda
street/editorial: fundo quase-preto, tipografia gigante e assimétrica
misturando preenchimento sólido e contorno vazado, fotos pequenas tipo
tearsheet no canto, legendas factuais espalhadas em mono rastreado, e um
decalque desenhado à mão de locs/tranças ancorado na base, sangrando pra
fora da composição. Referência confessa (adaptada, não copiada): o Hero da
Auralee no Dribbble (https://dribbble.com/shots/26236050). O resto do site
(Serviços, Galeria, Sobre, Contato) herda a tipografia e o movimento desse
mundo mas mantém a estrutura mais simples e clara já construída na Fase 2 —
não foi redesenhado ponto a ponto.

**Key Characteristics:**
- Fundo quase-preto na Hero e na Navbar; branco/cinza-claro no restante do
  site (contraste deliberado entre "vitrine" e "conteúdo utilitário").
- Vermelho da marca usado com peso real (tipografia grande, botões, traços
  do decalque) — nunca como accent decorativo pontual.
- Tipografia mono rastreada e maiúscula pra qualquer informação factual
  pequena (endereço, horário, categoria de serviço, rodapé).
- Um único gesto de assinatura: o decalque de locs/tranças desenhado à mão
  via SVG, "traçado" com animação de `pathLength` ao carregar a página.

## Colors

Paleta derivada da logo (vermelho + preto), estendida com tons quentes de
profundidade — nunca uma paleta nova inventada.

### Primary
- **Vermelho Lkas** (`#c8102e`, token `--color-brand-red`): tipografia de
  destaque, CTAs, hover states, 1 a cada 3 traços do decalque. Token
  histórico — já usado no admin/login antes da Fase 5, mantido estável.

### Neutral
- **Tinta** (`#0d0b0a`, `--color-brand-ink`): chão da Hero e da Navbar.
  Preto quente, não neutro puro — evita o preto "sterile" de UI genérica.
- **Creme** (`#f3ede3`, `--color-brand-cream`): texto e superfícies sobre
  fundo escuro (contorno do "LOCS", legendas, botão CTA da Hero).
- **Fumaça** (`#9c948b`, `--color-brand-smoke`): texto secundário sobre
  fundo escuro (legendas mono, rótulos da Navbar) — cinza quente, nunca
  cinza puro.
- **Preto Lkas** (`#111111`, `--color-brand-black`): texto de conteúdo nas
  seções claras (herdado da Fase 2, sem mudança).
- **Oxblood** (`#4a1116`, `--color-brand-oxblood`): glow radial de
  profundidade atrás do conteúdo da Hero — nunca em texto ou botão.

### Named Rules
**A Regra do Contraste Only.** Vermelho sobre tinta só em massa grande
(tipografia de destaque, blocos), nunca em texto corrido pequeno — a
combinação passa em ~3.3:1 (texto grande), insuficiente pra texto de leitura
longa.

## Typography

**Display Font:** Unbounded (peso 500–900)
**Body Font:** Manrope
**Label/Mono Font:** JetBrains Mono

**Character:** Unbounded é geométrica, blocuda, com presença de streetwear
contemporâneo — carrega a escala extrema da Hero sem virar "poster de
banda". Manrope é o workhorse legível pra corpo de texto, deliberadamente
neutro pra não competir com o display. JetBrains Mono dá o registro
"etiqueta de roupa/graffiti tag" a qualquer informação factual pequena.

### Hierarchy
- **Display** (900, `clamp(3.25rem, 12vw, 9.5rem)`, line-height 0.82):
  wordmark "LKAS LOCS" da Hero — "LKAS" preenchido em vermelho, "LOCS" só
  contorno (`-webkit-text-stroke`) em creme.
- **Headline** (700, `text-2xl sm:text-3xl`): `<h2>` de cada seção do site
  (Serviços, Galeria, Sobre, Contato) — mesma família do display, escala
  bem menor.
- **Body** (400, 1rem, line-height 1.5, medida ~65ch): parágrafos das
  seções, descrições de serviço.
- **Label** (400–500, 0.65–0.75rem, tracking 0.2–0.3em, uppercase): links
  da Navbar, botões pill ("Agendar", "Agendar horário"), legendas
  espalhadas da Hero, linhas de horário de funcionamento, rodapé.

### Named Rules
**A Regra do Kicker Proibido.** Nenhuma legenda mono fica empilhada
diretamente acima de um heading como "eyebrow" — as legendas ficam
espalhadas em outros pontos da composição (brief pede isso explicitamente).

## Layout

Hero: `min-h-[100svh]`, container `max-w-[1500px]`, margens laterais
generosas (`px-6` mobile → `px-16` desktop) — "margens visualmente mais
claras" do brief. Composição em 3 zonas verticais via `flex
justify-between`: legenda + fotos no topo, wordmark no meio, CTA + dica de
scroll na base. Fotos do canto superior direito só aparecem a partir de
`sm:` (640px) — mobile prioriza o wordmark.

Demais seções: contêiner centralizado `max-w-5xl` (Serviços, Galeria,
Sobre, Contato), padding vertical `py-24`, grid responsivo 2–3 colunas
pra cards/fotos. Essa parte não foi redesenhada na Fase 5 — herdada da
Fase 2, só ganhou tipografia e movimento novos.

## Elevation & Depth

Sem sombra estrutural na Hero — profundidade vem de duas camadas: (1) glow
radial oxblood atrás do conteúdo, contido por `overflow-hidden` num
wrapper próprio pra não vazar pra seção seguinte; (2) parallax real via
GSAP ScrollTrigger (fundo, decalque e fotos se movem em velocidades
diferentes ao rolar). Nas seções claras, sombra leve (`shadow-sm` →
`shadow-md` no hover) nos cards de serviço — mantido da Fase 2.

### Named Rules
**A Regra do Vazamento Controlado.** Só o decalque de locs pode sangrar
pra fora dos limites da Hero (`z-10`, sem `overflow-hidden` na seção); todo
o resto do conteúdo, incluindo o glow de fundo, fica contido.

## Shapes

Pills (`rounded-full`) em todo CTA/botão/tag. Cantos `rounded-xl` em
cards e fotos. A própria tipografia do wordmark não usa raio nenhum — é
o elemento "duro" da composição, contrastando com os pills macios dos
botões.

## Components

### Navbar
Barra escura fixa (`bg-brand-ink/95` + `backdrop-blur`), links em mono
rastreado maiúsculo, "Agendar" como pill vermelho separado dos links de
âncora — não é mais um link igual aos outros. Idêntica em toda a página
(não clareia ao rolar por cima de seções claras — decisão deliberada pra
evitar complexidade de troca de cor por scroll).

### Botões (CTA)
- **Shape:** pill (`rounded-full`, padding ~14px 28px).
- **Primário (fora da Hero):** fundo `brand-red`, texto `brand-cream`.
- **CTA da Hero:** fundo `brand-cream`, texto `brand-ink` → hover inverte
  pra `brand-red`/`brand-cream`. Seta (`→`) desliza no hover
  (`group-hover:translate-x-1`).
- **Secundário (card de serviço):** contorno `brand-red`, preenche no
  hover.

### HairDecal (componente de assinatura)
`src/components/site/hair-decal.tsx`. Tiras paramétricas (Catmull-Rom
sobre onda senoidal com envelope, determinístico por índice — sem
`Math.random`, pra não divergir SSR/cliente), com marcas de torção
perpendiculares simulando textura de loc/rope. "Desenhadas" via
`framer-motion` `pathLength` ao montar (não por scroll — o decalque já
faz parte da primeira viewport). 1 a cada 3 tiras em vermelho, o resto em
creme translúcido. Nunca usar pra representar rosto, personagem ou
clipart — só linework abstrato de cabelo.

### Cards de Serviço / Fotos da Galeria
Herdados da Fase 2 sem mudança estrutural: `rounded-xl`, `border
border-black/5`, `shadow-sm` → `shadow-md` no hover. Só o botão interno
("Agendar") e o heading da seção mudaram de tipografia.

## Do's e Don'ts

### Do:
- **Do** usar `font-label` (JetBrains Mono, uppercase, tracked) só pra
  informação factual real (endereço, horário, categoria) — nunca como
  decoração "tech" vazia.
- **Do** manter o glow de fundo da Hero contido em seu próprio wrapper
  `overflow-hidden`; só o `HairDecal` tem permissão de sangrar.
- **Do** gerar variação de `HairDecal` por índice determinístico — nunca
  `Math.random()` num componente que renderiza no servidor.
- **Do** manter `--color-brand-red` estável — é usado fora do site
  público (admin, login) desde a Fase 1.

### Don't:
- **Don't** adicionar rosto, personagem, cartoon ou clipart ao
  `HairDecal` ou a qualquer decalque futuro — só linework abstrato de
  cabelo (regra vinda do brief do cliente, ver PRODUCT.md).
- **Don't** empilhar uma legenda mono diretamente acima de um heading
  como "eyebrow" — ver Regra do Kicker Proibido.
- **Don't** trocar a cor da Navbar dinamicamente por scroll sem decisão
  explícita — a barra escura fixa foi escolhida por simplicidade/robustez,
  não por falta de alternativa.
- **Don't** redesenhar a estrutura de Serviços/Galeria/Sobre/Contato sem
  necessidade — a Fase 5 herdou a tipografia e o movimento, não reescreveu
  o layout (isso é decisão pra uma fase de redesign completo, não pra
  "Hero avançada").
