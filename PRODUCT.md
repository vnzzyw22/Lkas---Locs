# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primário: clientes de serviços capilares (locs, tranças, twists, cuidados
capilares, barbearia) em Maringá, PR, visitando o site pra conhecer serviços
e portfólio e agendar horário. Secundário: a proprietária/profissional da
Lkas Locs, usando o painel administrativo (`/admin`) pra gerenciar agenda,
clientes, serviços, galeria e financeiro — único usuário admin (1
profissional por deployment, sem tabela de papéis).

## Product Purpose

Site institucional + agendamento online + painel administrativo para a marca
Lkas Locs. O cliente escolhe um serviço, vê disponibilidade real (calculada a
partir da agenda e do horário de funcionamento) e confirma o pedido via
WhatsApp; o agendamento fica pendente até a profissional confirmar pelo
painel. Sucesso = agendamentos reais entrando pelo site sem fricção e sem
conflito de horário.

## Positioning

Primeiro cliente de uma base pensada para reuso: o mesmo código-base será
clonado e reimplantado (Vercel + Supabase próprios) para outros profissionais
futuros, sem multi-tenancy — dados da marca isolados em `business_settings`,
nunca hardcoded. Diferencial de posicionamento visual: identidade premium,
street, editorial e fashion — explicitamente não um site genérico de
salão/barbearia.

## Operating Context

- Fluxo público: Navbar → Hero → Serviços → Galeria → Sobre → Contato (landing
  de seção única), mais a página dedicada `/agendar` (wizard: serviço → data
  → horário → dados do cliente → confirmação via WhatsApp).
- Painel administrativo (`/admin`, autenticado via Supabase Auth, único papel
  "admin"): Dashboard, Agenda (confirmar/cancelar, bloquear horários),
  Clientes, Serviços, Galeria (upload no Supabase Storage), Financeiro,
  Configurações (dados da marca e horário de funcionamento).
- Sem pagamento antecipado. Cliente não cancela pelo sistema — só a
  proprietária, pelo painel. Status de agendamento: Pendente, Confirmado,
  Cancelado.

## Capabilities and Constraints

- Stack já definida (não greenfield): Next.js 16 (App Router, TypeScript) +
  Tailwind CSS v4 + Supabase (Postgres/Auth/Storage) + Vercel. Deploy ainda
  não conectado (repositório local).
- Preço e duração dos 8 serviços iniciais (Loctian, Barbeiro, Terapeuta
  Capilar, Starter Locs, Retwist, Barrel, Tranças, Twists) são placeholder,
  100% editáveis pelo painel — nunca hardcoded no front.
- Apenas 1 profissional por deployment — sem gerenciamento multi-profissional.
- Fuso fixo `America/Sao_Paulo` (sem horário de verão no Brasil desde 2019).

## Brand Commitments

- Nome: Lkas Locs. Logo: ilustração de um homem com tranças + estrelas em
  vermelho chapado, abaixo o nome — "Lkas" em vermelho, "Locs" em preto.
  **Logo final ainda não disponível** — usar `public/imagens/foto-logo-lkas.jpg`
  (150×150, placeholder de baixa-res) até a versão vetorial chegar; layout e
  paleta devem ficar preparados pra troca fácil quando ela chegar.
- Paleta deve derivar da própria logo (vermelho + preto + tons complementares
  sofisticados) — não inventar paleta completamente diferente.
- Referência visual vinculante para a Hero:
  https://dribbble.com/shots/26236050-Auralee-Luxury-Bold-Fashion-Ecommerce-Website-Home-Page-Desig
  — inspiração próxima na composição e linguagem visual (adaptada, não
  copiada literalmente): background com profundidade, margens laterais
  visualmente mais claras, contraste forte, tipografia grande e marcante,
  pequenas legendas/informações espalhadas pela composição, fotos pequenas no
  canto superior direito, elementos gráficos na parte inferior, sobreposição
  de elementos, composição assimétrica, sensação de movimento.
- Decalques/rabiscos de tranças-locs (street + fashion sketch + graffiti,
  mão-desenhado) ancorados no canto inferior da Hero, parcialmente
  ultrapassando os limites da composição — foco no cabelo/penteado (tranças,
  locs, twists, nagô). Proibido: rostos detalhados, personagens, cartoon,
  clipart, ilustrações genéricas, pessoas completas. Produzidos como SVG
  codado à mão (linha/sketch), não imagem gerada.
- Navbar tradicional/limpa, não a navegação da referência: **LKAS LOCS** |
  Início, Serviços, Galeria, Sobre, Contato | **Agendar**.
- Movimento: entrada de elementos ao carregar, parallax, diferentes
  velocidades no scroll, textos entrando/saindo, imagens reveladas no scroll,
  transições entre seções, microinterações em botões/links — sutil, sem
  excesso de efeitos aleatórios.

## Evidence on Hand

- `public/imagens/foto-logo-lkas.jpg` — logo placeholder atual (150×150, JPG,
  fundo branco sólido).
- `public/imagens/foto-tranças-1.jpg`, `foto-tranças-2.jpg` — fotos reais de
  portfólio, já com marca d'água própria; usadas na galeria e (recortadas) no
  canto superior direito da Hero. Mais fotos reais e a logo final chegam
  depois — não inventar imagens ou variações no meio tempo.
- Schema de dados completo já implementado no Supabase: `business_settings`,
  `services`, `clients`, `appointments`, `blocked_slots`, `gallery_photos`,
  `transactions`, com RLS por tabela.

## Product Principles

- Dados da marca nunca hardcoded — sempre lidos de `business_settings` /
  `services` / `gallery_photos` (modelo de template clonado por cliente).
- Cada fase implementada e testada antes de avançar (metodologia do projeto
  em CLAUDE.md) — não quebrar o que já funciona. Fases 1–4 concluídas:
  backend/dados, site público (estrutura), agendamento, painel administrativo.
- Identidade visual deve ficar deliberadamente distante de "site genérico de
  salão/barbearia" — premium, street, editorial, fashion, forte presença
  visual, movimento sutil, sem exagero.

## Accessibility & Inclusion

Nenhum requisito específico confirmado ainda além dos padrões gerais —
acessibilidade formal entra na Fase 6 do roadmap (junto com performance,
responsividade e testes E2E).
