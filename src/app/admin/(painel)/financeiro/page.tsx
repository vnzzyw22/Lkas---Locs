import { FinanceView } from "@/components/admin/finance-view";
import { pageSubtitleClass, pageTitleClass } from "@/components/admin/theme";
import { currentMonthISO } from "@/lib/date";
import { getTransactionsForRange } from "@/lib/supabase/admin-queries";

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
      <h1 className={pageTitleClass}>Financeiro</h1>
      <p className={pageSubtitleClass}>
        Entradas e saídas simples — não é um sistema contábil.
      </p>
      <FinanceView monthISO={monthISO} transactions={transactions} />
    </div>
  );
}
