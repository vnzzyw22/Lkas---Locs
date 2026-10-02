import { createClient } from "./server";
import type { AppointmentStatus, PaymentStatus } from "./types";

// Reserva temporária + consulta pública do sinal. Tudo passa por funções
// security definer do banco (ver 20261002120000_sinal_pix_manual.sql):
// appointments/clients continuam sem SELECT/UPDATE pra anon.

// Cancela reservas cujo prazo de pagamento venceu, liberando o horário.
// Idempotente; chamada antes de qualquer leitura de disponibilidade/painel.
export async function releaseExpiredReservations() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("release_expired_reservations");
  if (error) {
    console.error("Erro ao liberar reservas vencidas:", error.message);
  }
}

export interface BookingPayment {
  id: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  startsAt: string;
  endsAt: string;
  depositAmount: number | null;
  reservationExpiresAt: string | null;
  hairLength: string | null;
  clientName: string;
  serviceName: string;
  servicePrice: number;
  professionalName: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export async function getBookingPayment(
  id: string,
): Promise<BookingPayment | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_booking_payment", {
    p_id: id,
  });

  if (error) {
    console.error("Erro ao buscar agendamento (pagamento):", error.message);
    return null;
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    depositAmount: row.deposit_amount === null ? null : Number(row.deposit_amount),
    reservationExpiresAt: row.reservation_expires_at,
    hairLength: row.hair_length,
    clientName: row.client_name,
    serviceName: row.service_name,
    servicePrice: Number(row.service_price),
    professionalName: row.professional_name,
  };
}

export type ClaimResult =
  | "awaiting_confirmation"
  | "confirmed"
  | "not_required"
  | "cancelled"
  | "slot_taken"
  | "not_found"
  | "error";

// "Já fiz o Pix": só registra que o cliente iniciou a conferência. Nunca
// marca o pagamento como confirmado — isso é só da equipe, no painel.
export async function claimBookingPayment(id: string): Promise<ClaimResult> {
  if (!isUuid(id)) return "not_found";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_booking_payment", {
    p_id: id,
  });

  if (error || typeof data !== "string") {
    console.error("Erro ao registrar aviso de pagamento:", error?.message);
    return "error";
  }

  return data as ClaimResult;
}

export interface PaymentSnapshot {
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  // Segundos restantes da reserva, calculados no servidor: o relógio do
  // celular do cliente pode estar errado, então o navegador só conta a partir
  // deste valor, sem comparar com a hora local.
  remainingSeconds: number | null;
}

export function toPaymentSnapshot(
  booking: Pick<BookingPayment, "status" | "paymentStatus" | "reservationExpiresAt">,
): PaymentSnapshot {
  const remainingSeconds =
    booking.status === "pending" &&
    booking.paymentStatus === "awaiting_payment" &&
    booking.reservationExpiresAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(booking.reservationExpiresAt).getTime() - Date.now()) /
              1000,
          ),
        )
      : null;

  return {
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    remainingSeconds,
  };
}
