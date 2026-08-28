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
  - ⏳ Pendente: aplicar essas migrations no projeto Supabase real (`.env.local`
    já criado, ainda com `NEXT_PUBLIC_SUPABASE_URL` e
    `NEXT_PUBLIC_SUPABASE_ANON_KEY` vazios — preencher quando formos rodar isso),
    autenticação admin via Supabase Auth, esqueleto do painel protegido.
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
