import Link from "next/link";
import { PaymentsManager } from "@/components/admin/payments-manager";
import {
  linkPrimaryClass,
  pageSubtitleClass,
  pageTitleClass,
} from "@/components/admin/theme";
import { getDepositConfig } from "@/lib/deposit";
import { getPaymentQueue } from "@/lib/supabase/admin-queries";
import { getBusinessSettings } from "@/lib/supabase/queries";

export default async function PagamentosPage() {
  const [queue, business] = await Promise.all([
    getPaymentQueue(),
    getBusinessSettings(),
  ]);

  return (
    <div>
      <h1 className={pageTitleClass}>Pagamentos</h1>
      <p className={pageSubtitleClass}>
        Sinais via Pix aguardando conferência. O Pix cai direto na conta da
        loja: confirme aqui só depois de ver o valor.
      </p>

      {!getDepositConfig(business) && (
        <p className="mt-4 text-sm text-white/60">
          O sinal está desligado, então novos agendamentos não geram
          pagamento.{" "}
          <Link href="/admin/configuracoes" className={linkPrimaryClass}>
            Configurar sinal
          </Link>
        </p>
      )}

      <PaymentsManager queue={queue} />
    </div>
  );
}
