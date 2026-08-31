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
- **Fase 5 — Hero avançada:** parallax, decalques/rabiscos street/fashion sketch
  (sem rostos/personagens/clipart), animações finas de scroll.
- **Fase 6 — Performance, responsividade, testes E2E (Playwright), acessibilidade.**
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
