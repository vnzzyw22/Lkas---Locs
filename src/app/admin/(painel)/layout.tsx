import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/servicos", label: "Serviços" },
  { href: "/admin/galeria", label: "Galeria" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já bloqueia rotas /admin sem sessão; esta checagem aqui é
  // uma segunda camada de defesa direto no layout do painel.
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-neutral-200 bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="px-4 py-4">
          <span className="text-lg font-bold text-brand-black">
            Lkas <span className="text-brand-red">Locs</span>
          </span>
        </div>
        <nav className="flex flex-1 gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-brand-black"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="border-t border-neutral-200 p-2">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-brand-red"
          >
            Sair
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
