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
- **Fase 1 — Backend/dados** 🔄 em andamento:
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
  - ⏳ Pendente: aplicar as migrations no projeto Supabase real e testar o login
    de verdade (bloqueado agora pela `NEXT_PUBLIC_SUPABASE_URL` — ver nota
    abaixo).

### ⚠️ `.env.local` — URL do Supabase suspeita

`NEXT_PUBLIC_SUPABASE_URL` foi preenchida como `https://sjtvtxufudqetwoalvjl.supabase.com`.
Domínio de projeto Supabase é `.supabase.co`, não `.supabase.com` (esse é o site
institucional da empresa). Provavelmente um typo — confirmar com o usuário e
corrigir antes de testar login/dados reais.

### ⚠️ Next.js 16: `middleware` foi renomeado para `proxy`

Nesta versão (16.3.3) o arquivo de convenção `middleware.ts`/`export function
middleware` foi descontinuado e renomeado para `proxy.ts`/`export function
proxy` (mesmo comportamento, roda sempre em runtime Node.js, não Edge). Usar
`proxy.ts` na raiz de `src/`, não `middleware.ts`. Ver
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
antes de mexer nisso de novo.
- **Fase 2 — Site público (estrutura):** Navbar, Hero (estática), Serviços,
  Galeria, Sobre, Contato — já puxando dados reais do banco, sem agendamento.
- **Fase 3 — Agendamento:** fluxo completo do cliente + link WhatsApp pré-preenchido
  + prevenção de conflito no banco.
- **Fase 4 — Painel administrativo completo:** Dashboard, Agenda, Clientes,
  Serviços, Galeria, Financeiro, Configurações.
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
