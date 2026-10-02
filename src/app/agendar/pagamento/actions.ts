"use server";

import {
  claimBookingPayment,
  getBookingPayment,
  toPaymentSnapshot,
  type ClaimResult,
  type PaymentSnapshot,
} from "@/lib/supabase/reservations";

// Estado atual do agendamento (a consulta também libera reservas vencidas).
export async function refreshBookingPayment(
  id: string,
): Promise<PaymentSnapshot | null> {
  const booking = await getBookingPayment(id);
  return booking ? toPaymentSnapshot(booking) : null;
}

// "Já fiz o Pix": só registra que o cliente iniciou a conferência — o
// pagamento continua NÃO confirmado até a equipe conferir no painel.
export async function claimPayment(id: string): Promise<ClaimResult> {
  return claimBookingPayment(id);
}
