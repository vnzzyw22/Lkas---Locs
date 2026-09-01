import type { ReactNode } from "react";

interface BrandOutroProps {
  children: ReactNode;
}

// Fechamento escuro da página (Sobre + Contato + Rodapé), ecoando a Hero —
// estrutura "sanduíche": Hero escura (abertura) → Serviços/Galeria clara
// (conteúdo funcional) → aqui, escura de novo (fechamento). Só a cor sólida
// por enquanto — a versão com vídeo real da marca ao fundo (opacidade
// baixa + scrim) foi tentada e removida (não deu pra fazer o navegador do
// cliente exibir o vídeo, ver CLAUDE.md > Fase 6); retomar essa ideia numa
// sessão com Playwright disponível pra testar antes de reativar.
export function BrandOutro({ children }: BrandOutroProps) {
  return <div className="bg-brand-ink">{children}</div>;
}
