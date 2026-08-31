import { FinanceView } from "@/components/admin/finance-view";
import { getTransactionsForRange } from "@/lib/supabase/admin-queries";

function currentMonthISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}

function lastDayOfMonth(monthISO: string) {
  const [year, month] = monthISO.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export default async function FinanceiroPage(
  props: PageProps<"/admin/financeiro">,
) {
  const searchParams = await props.searchParams;
  const mesParam = searchParams.mes;
  const monthISO =
    (Array.isArray(mesParam) ? mesParam[0] : mesParam) || currentMonthISO();

  const fromDateISO = `${monthISO}-01`;
  const toDateISO = `${monthISO}-${String(lastDayOfMonth(monthISO)).padStart(2, "0")}`;

  const transactions = await getTransactionsForRange(fromDateISO, toDateISO);

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-black">Financeiro</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Entradas e saídas simples — não é um sistema contábil.
      </p>
      <FinanceView monthISO={monthISO} transactions={transactions} />
    </div>
  );
}
