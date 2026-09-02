@AGENTS.md

# Lkas Locs — guia do projeto

Site + agendamento + painel administrativo para a marca Lkas Locs (locs, tranças,
twists, cuidados capilares, barbearia — Maringá, PR). Primeiro cliente de uma base
pensada para reuso futuro com outros profissionais.

## Decisões confirmadas

- **Reuso futuro:** template clonado por cliente. Cada profissional futuro ganha seu
  próprio deploy (Vercel + Supabase) a partir deste código-base — sem multi-tenancy
  na aplicação, sem `business_id` nas tabelas. Dados da marca (Lkas Locs) ficam
  isolados na tabela `business_settings`, nunca hardcoded no frontend.
- **Gerenciador de pacotes:** npm.
- **Git:** repositório local apenas por enquanto. Remoto no GitHub fica para quando
  formos conectar o deploy na Vercel.
- **Stack:** Next.js (App Router, TypeScript) + Tailwind CSS v4 + Supabase
  (Postgres/Auth/Storage) + Vercel. Painel administrativo com shadcn/ui. Animações:
  Framer Motion (entradas/transições) + GSAP/ScrollTrigger (parallax da Hero).
- **Logo:** arquivo atual (`public/imagens/foto-logo-lkas.jpg`, 150×150, JPG, fundo
  branco sólido, sem transparência) está sendo usado como placeholder. Cores em
  `src/app/globals.css` (`--color-brand-red`, `--color-brand-black`) foram
  estimadas visualmente a partir dessa imagem — reavaliar com precisão quando uma
  versão maior/vetorial da logo estiver disponível (Fase 2/5).
- **Fotos de portfólio** (`foto-tranças-1.jpg`, `foto-tranças-2.jpg`) já têm marca
  d'água própria — ok para galeria, mas pedir versões sem marca d'água se forem
  usadas em recortes pequenos (ex.: Hero).

## Metodologia de trabalho

1. Analisar antes de alterar.
2. Explicar decisões de arquitetura relevantes antes de aplicá-las.
3. Implementar em etapas pequenas, sem quebrar o que já funciona.
4. Testar.
5. Corrigir problemas.
6. Só então avançar para a próxima etapa.

Não alterar componentes não relacionados sem necessidade.

## Fases

- **Fase 0 — Fundação** ✅ concluída: git local, scaffold Next.js + TypeScript +
  Tailwind + ESLint, tokens de cor da logo, `.env.local.example`. Contas do
  Supabase e da Vercel já criadas manualmente pelo usuário (login interativo,
  fora do alcance do agente).
- **Fase 1 — Backend/dados** ✅ concluída:
  - ✅ Schema completo em `supabase/migrations/20260828120000_schema_fase1.sql`
    (`business_settings`, `services`, `clients`, `appointments`, `blocked_slots`,
    `gallery_photos`, `transactions`) + RLS por tabela. Conflito de horário via
    constraint `EXCLUDE` do Postgres (`tstzrange`) em `appointments` e
    `blocked_slots` — **não** precisou da extensão `btree_gist`: só é necessária
    para combinar igualdade de outra coluna no mesmo índice GiST (ex.: múltiplos
    profissionais na mesma tabela), o que não se aplica aqui (1 profissional por
    deployment, modelo de template clonado).
  - ✅ Seed em `supabase/seed.sql`: linha única de `business_settings` e os 8
    serviços iniciais com preço/duração placeholder.
  - ✅ Autenticação admin via Supabase Auth (`@supabase/ssr`): clientes em
    `src/lib/supabase/{client,server,proxy}.ts`, login por email/senha em
    `src/app/admin/(auth)/login`, guarda de rota em `src/proxy.ts` +
    `src/app/admin/(painel)/layout.tsx` (dupla camada). Como só existe 1
    profissional, qualquer usuário autenticado no Supabase Auth é admin — sem
    tabela de papéis. **O usuário admin precisa ser criado manualmente no painel
    do Supabase (Authentication → Users → Add user)**, não há fluxo de cadastro.
  - ✅ Esqueleto de navegação do painel em `src/app/admin/(painel)/` — Dashboard,
    Agenda, Clientes, Serviços, Galeria, Financeiro, Configurações, todas como
    placeholder "Em construção — Fase 4".
  - ✅ `NEXT_PUBLIC_SUPABASE_URL` corrigida para `https://sjtvtxufudqetwoalvjl.supabase.co`
    (estava com typo `.supabase.com`, domínio institucional da empresa, não o do
    projeto).
  - ✅ Migration `20260828120000_schema_fase1.sql` e `supabase/seed.sql` aplicadas
    no projeto Supabase real via `supabase db push` (CLI vinculado com
    `supabase link --project-ref sjtvtxufudqetwoalvjl`).
  - ✅ Login do admin testado de ponta a ponta em `/admin/login` com sucesso —
    guarda de rota redireciona corretamente para o painel, que mostra os
    placeholders "Em construção — Fase 4" (esperado, conteúdo real só na Fase 4).

### ⚠️ Next.js 16: `middleware` foi renomeado para `proxy`

Nesta versão (16.3.3) o arquivo de convenção `middleware.ts`/`export function
middleware` foi descontinuado e renomeado para `proxy.ts`/`export function
proxy` (mesmo comportamento, roda sempre em runtime Node.js, não Edge). Usar
`proxy.ts` na raiz de `src/`, não `middleware.ts`. Ver
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
antes de mexer nisso de novo.
- **Fase 2 — Site público (estrutura)** ✅ concluída:
  - ✅ Landing page de seção única (`src/app/page.tsx`, Server Component) com
    Navbar (menu mobile), Hero estática, Serviços, Galeria, Sobre e Contato,
    navegação por âncora (`#servicos`, `#galeria`, `#sobre`, `#contato`).
  - ✅ Componentes em `src/components/site/`. Leituras públicas centralizadas em
    `src/lib/supabase/queries.ts` (`getBusinessSettings`, `getActiveServices`,
    `getPublishedGalleryPhotos`), respeitando a RLS de leitura pública já criada
    na Fase 1 — nada hardcoded no frontend.
  - ✅ Helpers: `src/lib/whatsapp.ts` (link `wa.me` com mensagem pré-preenchida,
    reaproveitável na Fase 3), `src/lib/format.ts` (preço em BRL, duração),
    `src/lib/business-hours.ts` (horário de funcionamento a partir do jsonb
    `business_hours`).
  - ✅ Migration `20260831120000_seed_gallery_photos.sql` aplicada no projeto
    Supabase real: popula `gallery_photos` com as 2 fotos de portfólio já
    existentes em `public/imagens` (com marca d'água própria, ok para galeria).
  - ✅ `lang="pt-BR"` no `layout.tsx`.
  - Sem Framer Motion/GSAP ainda — Hero é estática por design nesta fase;
    animações finas ficam para a Fase 5.
  - Texto da seção "Sobre" é placeholder estático (não há campo correspondente
    no schema ainda) — revisar copy real com o cliente antes do lançamento.
- **Fase 3 — Agendamento** ✅ concluída:
  - ✅ Página `/agendar` (`src/app/agendar/`) com wizard client-side
    (`src/components/booking/booking-form.tsx`): serviço → data → horário →
    dados do cliente → confirmação, com link `wa.me` pré-preenchido ao final.
    Aceita `?servico=<id>` (usado pelos cards da home e pelo CTA do Hero).
  - ✅ Server Actions em `src/app/agendar/actions.ts`: `getAvailableSlots`
    (calcula horários livres) e `createAppointment` (cria `clients` +
    `appointments`, sempre com `status: "pending"`).
  - ⚠️ **Achado importante de RLS:** `appointments`/`clients` só têm policy de
    `SELECT` pra `authenticated` (admin) — não pra `anon`. Isso quebra
    `INSERT ... RETURNING` (o `.select()` do supabase-js) mesmo quando o
    `WITH CHECK` do insert passa, porque o Postgres também aplica RLS de
    leitura sobre a linha retornada. Corrigido gerando o `id` do client no
    servidor (`crypto.randomUUID()`) e inserindo sem `.select()`. Lição: todo
    insert público novo neste projeto deve evitar `.select()`/`RETURNING`, a
    não ser que se adicione uma policy de `SELECT` explícita (avaliar caso a
    caso — não abrir leitura pública de `clients`/`appointments`, que contêm
    dado do cliente).
  - ✅ Migration `20260901120000_busy_slots_view.sql` aplicada no projeto real:
    view `public.busy_slots` (só `starts_at`/`ends_at`, roda com privilégio do
    dono pra contornar a RLS acima só nesse recorte de colunas) — nenhum dado
    de cliente/serviço/motivo de bloqueio é exposto por ela.
  - ✅ Cálculo de disponibilidade em `src/lib/scheduling.ts` (função pura,
    testada com dados reais do banco): candidatos a cada 30 min dentro do
    `business_hours` do dia, descartando overlap com `busy_slots` e horários
    passados. Fuso fixo `America/Sao_Paulo` (`-03:00`, sem horário de verão no
    Brasil desde 2019) — sem lib de timezone.
  - ✅ Testado ponta a ponta contra o banco real via REST API (criação de
    client/appointment, conflito de horário disparando a constraint
    `appointments_no_overlap`/`23P01`, leitura da view) — dados de teste
    removidos ao final. Confirmado depois também no navegador pelo usuário.
  - Nota: `clients` não é deduplicado por whatsapp — cada agendamento cria um
    novo registro. Aceitável no MVP; mesclagem de clientes fica pra Fase 4.
- **Fase 4 — Painel administrativo completo** ✅ concluída (Configurações →
  Serviços → Agenda → Clientes → Galeria → Financeiro → Dashboard, nessa
  ordem, cada seção testada no navegador contra o banco real antes de avançar
  pra próxima):
  - ✅ **Configurações** (`src/app/admin/(painel)/configuracoes/`): formulário
    edita `business_settings` (nome, whatsapp, instagram, endereço, horário de
    funcionamento por dia). `DAY_ORDER`/`DAY_LABELS` exportados de
    `src/lib/business-hours.ts` pra reuso no formulário.
  - ✅ **Serviços** (`.../servicos/`): CRUD completo (`src/lib/supabase/
    admin-queries.ts#getAllServices` — inclui inativos, ao contrário da versão
    pública). Exclusão trata `23503` (FK restrict de `appointments`) sugerindo
    desativar em vez de excluir.
  - ✅ **Agenda** (`.../agenda/`): visão por dia (`?data=YYYY-MM-DD`),
    confirmar/cancelar agendamento, criar/remover bloqueio manual
    (`blocked_slots`, mesma constraint `EXCLUDE` de conflito). Join com
    `clients`/`services` via `getAppointmentsForRange`.
  - ✅ **Clientes** (`.../clientes/`): listar, busca client-side, editar,
    excluir (mesmo tratamento de FK restrict que Serviços).
  - ✅ **Galeria** (`.../galeria/`): bucket público `gallery` no Supabase
    Storage (migration `20260901130000_gallery_storage_bucket.sql` — leitura
    pública, insert/update/delete só admin). Upload valida tipo/tamanho
    (máx. 5MB), gera path com UUID, grava a URL pública em `gallery_photos`.
    Exclusão remove registro **e** arquivo do Storage — mas só quando a URL
    bate com o padrão do bucket; as 2 fotos legadas em `public/imagens` (seed
    da Fase 2) são ignoradas nesse passo, só o registro do banco sai.
    `next.config.ts` libera o hostname do Supabase (derivado de
    `NEXT_PUBLIC_SUPABASE_URL`, não hardcoded — importa pro modelo de reuso)
    em `images.remotePatterns` pro `next/image`.
  - ✅ **Financeiro** (`.../financeiro/`): navegação por mês (`?mes=YYYY-MM`),
    resumo (entradas/saídas/saldo), lançar/excluir transação.
  - ✅ **Dashboard** (`.../page.tsx`): atendimentos de hoje, próximos 7 dias e
    resumo financeiro do mês — reaproveita as queries de Agenda/Financeiro,
    sem nova lógica de dados.
  - ✅ `getAllClients`, `getAllServices`, `getAppointmentsForRange`,
    `getBlockedSlotsForRange`, `getAllGalleryPhotos`, `getTransactionsForRange`
    centralizadas em `src/lib/supabase/admin-queries.ts` (separado de
    `queries.ts`, que é só leitura pública — RLS diferente, não misturar).
  - ✅ `todayISO`/`currentMonthISO` centralizados em `src/lib/date.ts`
    (estavam duplicados em `booking-form.tsx`, Agenda e Financeiro).
  - Padrão de mutação nos client components do painel: chamar a Server Action
    diretamente (não `<form action>`) e, no sucesso, `router.refresh()` — sem
    isso a lista não atualiza porque os dados vêm de um Server Component pai.
- **Fase 5 — Hero avançada** ✅ concluída:
  - ✅ `PRODUCT.md` e `DESIGN.md` criados na raiz (processo do skill
    `impeccable`) — brief visual completo do cliente (referência Dribbble
    Auralee, decalques, paleta derivada da logo, navbar, movimento) estava
    no prompt original e tinha sido perdido numa passada anterior; recuperado
    e registrado como brand commitment durável.
  - ✅ Hero reconstruída (`src/components/site/hero.tsx`): wordmark
    "LKAS LOCS" gigante (Unbounded, `clamp(3.25rem,12vw,9.5rem)`, "LKAS"
    preenchido em vermelho / "LOCS" só contorno), fotos reais no canto
    superior direito, legendas mono espalhadas (endereço real, nunca
    inventado), composição assimétrica em 3 zonas, fundo quase-preto
    (`--color-brand-ink`) com glow oxblood contido em wrapper próprio.
  - ✅ Decalque de assinatura (`src/components/site/hair-decal.tsx`): tiras
    de locs/tranças geradas parametricamente (Catmull-Rom sobre onda
    senoidal, determinístico por índice — sem `Math.random`, evita
    divergência SSR/cliente), "desenhadas" via `framer-motion` `pathLength`
    ao montar. Ancorado na base da Hero, sangra de propósito pra dentro da
    seção seguinte (`z-10`, sem `overflow-hidden` na Hero) — só esse
    elemento tem permissão de vazar, o glow de fundo fica contido à parte.
  - ✅ Parallax real via GSAP ScrollTrigger (fundo/decalque/fotos em
    velocidades diferentes) + entrada coreografada via Framer Motion
    (stagger). `framer-motion` e `gsap` instalados.
  - ✅ 3 fontes novas via `next/font/google`: Unbounded (display), Manrope
    (corpo, substitui Geist), JetBrains Mono (legendas/dados — endereço,
    horário, categoria; nunca decorativo). Tokens de cor estendidos em
    `globals.css`: `--color-brand-ink/cream/oxblood/smoke` (mantendo
    `--color-brand-red`/`black` estáveis, já usados no admin desde a
    Fase 1).
  - ✅ Navbar reescrita pro mundo escuro (`bg-brand-ink/95`), com "Agendar"
    como CTA separado dos links — igual em toda a página, sem troca de cor
    por scroll (decisão de simplicidade, ver DESIGN.md).
  - ✅ Passada leve de continuidade nas seções da Fase 2 (Serviços, Galeria,
    Sobre, Contato): `<Reveal>` (`src/components/site/reveal.tsx`, fade+slide
    `whileInView`) + tipografia display/label — sem redesenhar a estrutura
    delas (fora do escopo de "Hero avançada").
  - ⚠️ **Achado de teste:** captura `fullPage` do Playwright renderizou as
    seções abaixo da Hero em branco — artefato da própria ferramenta de
    screenshot, que não dispara o `IntersectionObserver` do
    `whileInView` corretamente numa captura automatizada. Confirmado com
    scroll real (`window.scrollTo` + screenshot por viewport) que o conteúdo
    aparece normalmente; usar sempre esse método pra validar reveals de
    scroll, nunca só a captura `fullPage`.
  - ✅ Detector mecânico do skill (`detect.mjs`) rodado sobre todos os
    arquivos alterados — zero achados. `tsc`/`eslint` limpos.
  - ✅ **Rodada de feedback pós-Fase 5** (2026-09-01): decalque procedural
    (`hair-decal.tsx`) substituído por 2 fotos reais do cliente
    (`public/imagens/decalque01.jpg`/`decalque02.jpg`, traço vermelho
    fino sobre fundo "transparente" só representado por checkerboard, sem
    alfa real) processadas por `scripts/process-decals.mjs` (máscara de
    alfa por "vermelhidão" do pixel, recolorido pra `--color-brand-red`
    exato) em `decal-locs-01.png`/`decal-locs-02.png` (alfa real,
    conferido). Uso em `hero.tsx`: `decal-locs-01` como acento ao lado do
    "LOCS"; `decal-locs-02` como marca d'água de fundo em escala gigante,
    opacidade baixa. Ver `DESIGN.md` > Decalque de assinatura.
  - ⚠️ **Achado real de bug:** o `<Image fill>` de cada foto em
    `hero-photo-deck.tsx` estava dentro de uma div sem `position:
    relative` — o Next.js exige um ancestral posicionado pra `fill`
    funcionar; sem isso a imagem tende a estourar o contêiner pretendido.
    Era a causa provável do título não subir mesmo depois de reduzir o
    espaçamento (as fotos "ocupavam o espaço da foto inteira", no
    diagnóstico do próprio cliente). Corrigido adicionando `relative` na
    classe do wrapper. Lição: sempre conferir o warning do Next no console
    do navegador (`has "fill" and parent element with invalid
    "position"`) antes de investigar CSS/spacing como causa de layout
    quebrado.
  - ✅ Deque de fotos (`HeroPhotoDeck`) tirado do fluxo do layout (virou
    `absolute` dentro de um wrapper `relative` só com a legenda) — antes
    reservava altura de flex-row mesmo com as fotos posicionadas
    absolutamente dentro dele, empurrando o título pra baixo.
  - ⚠️ **Achado de ambiente:** console do navegador do cliente mostrou
    "You have Reduced Motion enabled on your device" (aviso do
    Framer Motion) — o SO/navegador dele está com "reduzir animações"
    ativado, o que desliga o parallax do GSAP e a animação idle das fotos
    (ambos checam `useReducedMotion()`, corretamente, por acessibilidade).
    É a explicação provável pro relato de "a flutuação não está mais
    funcionando" — não é regressão de código. Reforçada a flutuação idle
    das fotos (`hero-photo-deck.tsx`: adicionado bob vertical além da
    leve rotação) pra ficar mais perceptível quando animações estiverem
    ativas. Não decidido ainda se o bob idle (decorativo, não
    scroll-linked) deveria ignorar essa preferência — perguntar ao
    cliente antes de mudar esse gate.
- **Fase 6 — Performance, responsividade, testes E2E (Playwright), acessibilidade.**
  Em andamento (2026-09-01). Ordem escolhida com o cliente: responsividade →
  acessibilidade → performance → testes E2E.
  - ✅ **Responsividade — Hero:** criado `hero-photo-strip.tsx` (fileira
    estática de fotos reais, sem leque/parallax/hover, só `sm:hidden`
    implícito por não ter equivalente do lado do deque — a lógica de
    quando cada um aparece já é `sm:` em ambos) — mostrado abaixo do
    endereço, exclusivamente abaixo de 640px. Acima disso, o
    `HeroPhotoDeck` (leque + parallax + hover/toque) assume. O decalque
    de assinatura continua escondido no mobile (decorativo; as fotos
    reais do trabalho importam mais nesse espaço apertado).
  - ✅ **Pendência resolvida:** o "quase nada aparecendo" relatado no
    celular do cliente **não era bug do código** — era o Chrome Android
    renderizando a página em modo "Site para computador" (navbar
    aparecia com o menu completo de desktop, sem o hambúrguer mobile,
    confirmado por screenshot). Confirmado no F12 (emulação mobile) que
    está tudo certo. Resto do site público (`/agendar`, Serviços,
    Galeria, Sobre, Contato, Rodapé) auditado por leitura de código —
    nenhum outro `Image fill` sem `position: relative`, nenhuma largura
    fixa arriscando overflow horizontal.
  - ✅ **Acessibilidade — primeira passada:**
    - Link "Pular para o conteúdo" (`src/app/layout.tsx`, `sr-only
      focus:not-sr-only`) apontando pra `#conteudo` — adicionado esse id
      no `<main>` de `page.tsx` e `agendar/page.tsx`.
    - `aria-pressed` nos botões de horário do agendamento
      (`booking-form.tsx#SlotPicker`) — sem isso, leitor de tela não
      anunciava qual horário estava selecionado.
    - `aria-label` do botão hambúrguer (`navbar.tsx`) agora reflete o
      estado ("Abrir menu"/"Fechar menu"), não só `aria-expanded`.
    - Conferido: nenhum `outline-none` sem substituto (só existe no
      login do admin, com `focus:ring` no lugar — ok). Hierarquia de
      headings (h1 Hero → h2 por seção → h3 pontual) consistente.
      Landmarks semânticos (`header`/`main`/`footer`) já existiam.
    - Contraste checado manualmente (fórmula WCAG): `--color-brand-red`
      sobre `--color-brand-ink` (wordmark "LKAS") ≈ 3.3:1 — passa AA só
      por ser "large text" (texto gigante/bold); não usar essa combinação
      pra texto pequeno/normal em lugar nenhum do site.
      `--color-brand-smoke` sobre `--color-brand-ink` ≈ 6.6:1, ok.
    - Pendente (não crítico ainda): sem trap de foco/ESC no menu mobile
      aberto; sem revisão de `neutral-500` do Tailwind em fundo branco
      (~4.6:1, no limite do AA — padrão já usado antes da Fase 6, não
      introduzido agora).
  - ✅ **Performance — primeira passada:**
    - `npm run build` real rodado pra medir bundle de verdade (Turbopack
      não imprime a tabela de tamanho por rota nesta versão — inspecionei
      os chunks em `.next/static/chunks` direto).
    - **Achado:** `gsap` (núcleo, ~200KB no disco) estava com `import`
      estático no topo de `hero.tsx`, `hero-photo-deck.tsx` e
      `gallery-grid.tsx`, mesmo só sendo usado dentro de `useEffect`
      pós-montagem — entrava no bundle inicial de toda visita, mesmo com
      `reduceMotion` ativado. Só o `gsap/ScrollTrigger` já era dinâmico.
      Corrigido: os 3 arquivos agora importam `gsap` E `gsap/ScrollTrigger`
      juntos via `Promise.all([import("gsap"), import("gsap/ScrollTrigger")])`
      dentro do próprio `useEffect` — mesmo comportamento, carrega só
      depois da montagem, fora do JS inicial da página. Confirmado via
      build de produção real (`next start` numa porta separada): o chunk
      de ~200KB do gsap sumiu da lista de scripts carregados na home.
    - `priority` adicionado nas fotos reais da Hero (`HeroPhotoDeck` e
      `HeroPhotoStrip`, só as 2 primeiras) — são conteúdo acima da dobra,
      sem isso o Next as trata como lazy (`loading="lazy"`), atrasando o
      carregamento do que já aparece na primeira tela.
    - `package.json` conferido: sem dependências não usadas.
    - Pendente pra próxima passada: nenhuma imagem tem `next/image` com
      formato AVIF/WebP forçado nem `blur` placeholder — avaliar se vale a
      pena; e medir Core Web Vitals reais (LCP/CLS/INP) com Lighthouse ou
      PageSpeed Insights, que eu não consigo rodar sem navegador aqui.
  - ✅ **Brand Outro (vídeo de fundo em Sobre + Contato + Rodapé):** cliente
    trouxe um vídeo real da marca (`WhatsApp Video 2026-09-01 at
    15.04.08.mp4`, renomeado pra `public/imagens/video-marca-lkas.mp4`, 4.4MB)
    querendo usá-lo de fundo, mas o vídeo muda de cor — destruiria
    legibilidade se colocado direto sobre fundo branco. Uma IA à parte
    sugeriu bloco escuro + overlay (sugeriu "Serviços"); decisão tomada em
    conjunto foi usar em **Sobre + Contato + Rodapé** (não Serviços/Galeria,
    que precisam de fundo neutro pra preço/duração/fotos), criando estrutura
    "sanduíche" com a Hero. Implementado em `brand-outro.tsx` +
    `brand-outro-video.tsx` (ver `DESIGN.md` > Brand Outro pro detalhe
    técnico completo: opacidades calculadas por contraste WCAG, lazy via
    `IntersectionObserver`, `motion-reduce:hidden`). `AboutSection`/
    `ContactSection`/`Footer` migraram pra paleta escura da Hero.
    **Limitação:** não consegui testar visualmente (sem Playwright) — pedir
    pro cliente conferir no navegador (scroll até o fim) antes de dar como
    fechado.
    - ⚠️ **Achado de ambiente (de novo):** cliente reportou "só tela preta"
      — era o `motion-reduce:hidden` do vídeo escondendo tudo porque o
      navegador dele está com "reduzir animação" ativado (mesmo achado já
      registrado acima pra Hero). Decisão do cliente, informado do
      trade-off: vídeo autoplay em loop **ignora** essa preferência agora
      (removido o `motion-reduce:hidden`), mesma escolha já feita pra
      flutuação idle das fotos.
    - ⚠️ **Bug real, causa raiz encontrada:** mesmo sem o `motion-reduce` e
      com o vídeo simplificado ao máximo (tag estática, `autoPlay` direto
      no HTML, sem JS nenhum), ainda não aparecia — 3ª tentativa falhando.
      Achado via log do servidor de dev (`GET /imagens/video-marca-lkas
      404`, repetido em toda visita): o navegador pedia o arquivo **sem a
      extensão `.mp4`** — causa exata não identificada (não reproduzido
      via `curl`, só no navegador real do cliente), mas confirmado que é
      isso mesmo: com um `rewrites()` em `next.config.ts` mapeando
      `/imagens/video-marca-lkas` → `/imagens/video-marca-lkas.mp4`, o
      arquivo passa a responder 200 nos dois caminhos. Lição: quando um
      recurso "não aparece" sem erro nenhum no console, checar o log de
      requisições do servidor (`next dev` loga toda rota, inclusive 404) —
      foi isso que revelou o problema real, depois de duas tentativas de
      reescrever a lógica de carregamento do vídeo sem necessidade (o
      problema nunca esteve ali).
    - ✅ **Confirmado funcionando pelo cliente** (2026-09-01), na versão
      estática simples (`<video autoPlay src=...>`, sem
      `IntersectionObserver`/carregamento sob demanda). Tentei reintroduzir
      essa otimização de performance logo em seguida, sem testar de novo
      antes — quebrou de novo. Decisão: **manter a versão estática**
      (custo aceito: ~4.4MB carregam eager, mesmo a seção ficando abaixo da
      dobra) até haver uma sessão com Playwright disponível pra testar a
      versão lazy com segurança antes de trocar de novo. Não reintroduzir
      o `IntersectionObserver` aqui sem testar ponta a ponta primeiro.
  - ⏸️ **Vídeo de fundo removido** (2026-09-01): tentativa de usar o vídeo
    real da marca em Sobre/Contato/Rodapé (ver bullet acima) não funcionou
    no navegador do cliente mesmo após corrigir a causa raiz encontrada
    (404 por extensão faltando) — 2ª tentativa de reintroduzir a
    otimização de carregamento quebrou de novo. A pedido do cliente,
    `brand-outro-video.tsx` foi **removido** e `brand-outro.tsx` virou só
    `bg-brand-ink` sólido (mantém o "sanduíche" escuro com a Hero, sem
    vídeo). O arquivo `public/imagens/video-marca-lkas.mp4` continua no
    projeto (não pesa nada parado) pra retomar essa ideia numa sessão com
    Playwright disponível — **não reimplementar sem testar ponta a ponta
    antes de entregar**.
  - ✅ **Redesign de Serviços** (2026-09-01): cards perderam
    `rounded-xl`/fundo branco/sombra — viraram vazados (`border
    border-brand-red/40`, cantos retos). Botão "Agendar" virou bloco
    sólido `bg-brand-red` com cantos retos (diferente do CTA da navbar,
    que é `rounded-full` — pedido específico pra esse contexto). **Duas
    coisas testadas e revertidas a pedido do cliente:** (1) fundo escuro
    `bg-brand-ink` — não gostou, voltou pro fundo claro original (`text
    -brand-black`/`text-neutral-500`, não `-cream`/`-smoke`); (2)
    escalonamento entre cards (`sm:mt-8` em índices ímpares) — achou
    "torto", removido, grade voltou a ficar perfeitamente alinhada. Fica
    então: fundo claro igual antes + cards quadrados/vazados + botão
    sólido, sem quebra de simetria. Galeria continua clara também
    (cliente confirmou, sem pendência). Cards aumentados especificamente
    em `lg:` (padding, gap, tipografia, botão) — sentiu pequeno demais
    pra tela de computador; mobile/tablet ficaram como estavam.
  - ⏸️ **Testes E2E (Playwright): pendente, adiado a pedido do cliente.**
    Motivo: o MCP do Playwright não conectou nesta sessão (várias
    tentativas), então não dá pra escrever os testes com confiança de que
    rodam. Retomar quando o Playwright estiver disponível — não avançar
    pra Fase 7 sem isso.
  - ✅ **Redesign de Serviços/Rodapé/Galeria** (2026-09-02): primeiro serviço
    virou "abertura" em largura cheia com foto de fundo (`LEAD_PHOTO`,
    `foto-tranças-1.jpg`) e tipografia bem maior; demais serviços em grade
    sem caixa/borda, separados só por espaço negativo, com numeral
    decorativo (`aria-hidden`) e CTA com seta animada no hover. Rodapé
    ganhou logo + wordmark + linha divisória antes do copyright. Galeria
    ganhou título contorno+preenchido (mesmo tratamento de Serviços) e
    cards com `rounded-2xl`/ring sutil. Novo token `--color-brand-paper`
    (off-white quente) em `globals.css` pro fundo dessas seções — diferente
    de `--color-brand-cream` (que é texto sobre fundo escuro, não fundo de
    seção clara). Revisado por screenshot via Playwright antes do commit.
  - 📋 **Pendências para a próxima sessão** (registradas em 2026-09-02, cliente pediu pra retomar amanhã):
    - **Rodapé:** ajustar mais — o que foi feito na Fase 6 (logo + linha
      divisória) não é o suficiente.
    - **Navbar:** estilizar (ainda não especificado o quê exatamente —
      alinhar com o cliente no início da sessão).
    - **1º Serviço:** o card "abertura" em largura cheia (redesign de
      2026-09-02, ver acima) precisa de ajuste — cliente não deu detalhe
      ainda, perguntar o que incomoda antes de mexer.
    - **Painel admin:** mexer (sem escopo definido ainda).
    - **Página de agendamento (`/agendar`):** mexer (sem escopo definido
      ainda).
    - **Galeria:** arrumar mais — o redesign do título/cards acima não
      resolveu tudo.
    - Também em aberto de sessões anteriores, ainda não retomado: novos
      decalques nas silhuetas que o cliente mandou (`exemplo-decalque*`
      em `public/imagens`) substituindo os atuais (`decal-locs-01/02`,
      derivados de foto), reposicionados conforme a marcação manual do
      cliente (`posição-que-deve-ficar-os-decalques-que-eu-adicionei.png`);
      e confirmar se a tela preta de `Print-do-meu-celular.jpg` ainda
      acontece ou já foi resolvida pela remoção do vídeo de fundo (ver
      Fase 6 > Brand Outro).
- **Fase 7 — Documentação do processo de reuso para o próximo profissional.**

## Serviços iniciais (placeholder de preço/duração)

Loctian, Barbeiro, Terapeuta Capilar, Starter Locs, Retwist, Barrel, Tranças,
Twists. Preço e duração devem ser 100% editáveis pelo painel — nunca hardcoded.

## Regras de negócio a lembrar

- Sem pagamento antecipado no MVP.
- Cliente não cancela pelo sistema — só o proprietário, pelo painel.
- WhatsApp: gerar mensagem pré-preenchida (nome, serviço, data, horário,
  observação). Sem integração de API complexa por enquanto; deixar a arquitetura
  preparada para automação futura.
- Status de agendamento: Pendente, Confirmado, Cancelado.
- Apenas 1 profissional por enquanto — sem gerenciamento multi-profissional.
