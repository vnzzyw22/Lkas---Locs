"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAwaitingPaymentsCount } from "@/app/admin/(painel)/pagamentos/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/pagamentos", label: "Pagamentos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/servicos", label: "Serviços" },
  { href: "/admin/profissionais", label: "Profissionais" },
  { href: "/admin/galeria", label: "Galeria" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

const PAYMENTS_POLL_MS = 30_000;

interface AdminNavProps {
  initialPendingPayments: number;
}

// Extraído do layout (2026-09-03) só pra poder marcar o item ativo via
// `usePathname` — o layout em si é Server Component (lê a sessão do
// Supabase), então essa marcação de estado só pode viver num client
// component à parte. O contador de pagamentos também mora aqui: o layout não
// re-renderiza a cada navegação, então ele reconsulta ao trocar de página e a
// cada 30s (o painel costuma ficar aberto o dia todo).
export function AdminNav({ initialPendingPayments }: AdminNavProps) {
  const pathname = usePathname();
  const [pendingPayments, setPendingPayments] = useState(initialPendingPayments);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const count = await getAwaitingPaymentsCount();
        if (!cancelled) setPendingPayments(count);
      } catch {
        // Falha de rede: mantém o último número.
      }
    }

    void load();
    const timer = setInterval(load, PAYMENTS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);

  return (
    <nav className="flex flex-1 gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        const showBadge = item.href === "/admin/pagamentos" && pendingPayments > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-md px-3 py-2 font-nav text-xs font-bold tracking-widest uppercase transition-colors duration-200 ${
              active
                ? "bg-brand-red text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
            {showBadge && (
              <span
                aria-label={`${pendingPayments} aguardando confirmação`}
                className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-none tabular-nums ${
                  active ? "bg-white text-brand-red" : "bg-brand-red text-white"
                }`}
              >
                {pendingPayments}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
