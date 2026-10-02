// Regras puras do sinal via Pix manual. Sem API de pagamento: o cliente paga
// pela chave Pix da loja, avisa pelo WhatsApp e a equipe confere no painel.

import type {
  AppointmentStatus,
  BusinessSettings,
  PaymentStatus,
} from "@/lib/supabase/types";

export interface DepositConfig {
  amount: number;
  pixKey: string;
  holdMinutes: number;
}

// O sinal só liga com valor > 0, chave Pix e WhatsApp configurados — sem
// qualquer um deles o cliente não teria como pagar ou mandar o comprovante,
// então o agendamento segue o fluxo antigo (pendente -> confirma pelo painel).
export function getDepositConfig(
  business: Pick<
    BusinessSettings,
    "deposit_amount" | "pix_key" | "deposit_hold_minutes" | "whatsapp"
  > | null,
): DepositConfig | null {
  if (!business) return null;

  const pixKey = business.pix_key?.trim();
  if (!(business.deposit_amount > 0) || !pixKey || !business.whatsapp?.trim()) {
    return null;
  }

  return {
    amount: business.deposit_amount,
    pixKey,
    holdMinutes: business.deposit_hold_minutes,
  };
}

// Identificação curta do agendamento pra citar no WhatsApp e achar no painel.
export function bookingCode(id: string) {
  return id.slice(0, 8).toUpperCase();
}

// Aceita "30", "30,5", "30,00", "R$ 30,00", "1.500,00" e "30.50".
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/R\$|\s/g, "");
  if (!cleaned) return null;

  let normalized: string;
  if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "");
  } else {
    normalized = cleaned;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
}

export type StatusTone = "amber" | "green" | "neutral" | "red";

// Rótulo único pro que a equipe vê (agenda, dashboard, pagamentos): junta o
// status do agendamento com o estado do sinal.
export function appointmentStatusInfo(a: {
  status: AppointmentStatus;
  payment_status: PaymentStatus;
}): { label: string; tone: StatusTone } {
  if (a.status === "cancelled") {
    return a.payment_status === "expired"
      ? { label: "Reserva expirada", tone: "neutral" }
      : { label: "Cancelado", tone: "neutral" };
  }
  if (a.status === "confirmed") return { label: "Confirmado", tone: "green" };

  if (a.payment_status === "awaiting_payment") {
    return { label: "Aguardando pagamento", tone: "amber" };
  }
  if (a.payment_status === "awaiting_confirmation") {
    return { label: "Aguardando confirmação", tone: "amber" };
  }
  return { label: "Pendente", tone: "amber" };
}

// O sinal ainda precisa de conferência da equipe (ou foi reserva vencida que
// o cliente pode ter pagado depois).
export function needsPaymentReview(a: {
  status: AppointmentStatus;
  payment_status: PaymentStatus;
}) {
  if (a.payment_status === "expired") return true;
  return (
    a.status === "pending" &&
    (a.payment_status === "awaiting_payment" ||
      a.payment_status === "awaiting_confirmation")
  );
}
