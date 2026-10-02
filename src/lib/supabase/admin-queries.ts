import { createClient } from "./server";
import { releaseExpiredReservations } from "./reservations";
import type {
  AdminAppointment,
  AdminBlockedSlot,
  AdminClient,
  AdminGalleryPhoto,
  AdminProfessional,
  AdminService,
  AdminTransaction,
} from "./types";

// Leituras administrativas: exigem sessão autenticada (RLS via policies
// "_admin_all"). Usar só dentro de src/app/admin/**.

export async function getAllServices(): Promise<AdminService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, description, price, duration_minutes, image_url, active, display_order, hair_durations:service_hair_durations(hair_length, duration_minutes)",
    )
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar services (admin):", error.message);
    return [];
  }

  return data;
}

// Colunas do agendamento + sinal, compartilhadas pela agenda e pela fila de
// pagamentos.
const APPOINTMENT_COLUMNS =
  "id, starts_at, ends_at, status, notes, hair_length, payment_status, deposit_amount, reservation_expires_at, payment_claimed_at, payment_confirmed_at, payment_confirmed_by, client:clients(id, name, whatsapp), service:services(id, name, price), professional:professionals(id, name)";

export async function getAppointmentsForRange(
  fromISO: string,
  toISO: string,
): Promise<AdminAppointment[]> {
  // Reserva de sinal vencida vira "expirada" antes de a equipe olhar.
  await releaseExpiredReservations();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS)
    .lt("starts_at", toISO)
    .gt("ends_at", fromISO)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar appointments (admin):", error.message);
    return [];
  }

  return data as unknown as AdminAppointment[];
}

export async function getBlockedSlotsForRange(
  fromISO: string,
  toISO: string,
): Promise<AdminBlockedSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocked_slots")
    .select("id, starts_at, ends_at, reason, professional:professionals(id, name)")
    .lt("starts_at", toISO)
    .gt("ends_at", fromISO)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar blocked_slots (admin):", error.message);
    return [];
  }

  return data as unknown as AdminBlockedSlot[];
}

export async function getAllClients(): Promise<AdminClient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, whatsapp, notes, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar clients (admin):", error.message);
    return [];
  }

  return data;
}

export async function getAllGalleryPhotos(): Promise<AdminGalleryPhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id, url, category, published, display_order")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar gallery_photos (admin):", error.message);
    return [];
  }

  return data;
}

export async function getTransactionsForRange(
  fromDateISO: string,
  toDateISO: string,
): Promise<AdminTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, category, amount, description, occurred_at")
    .gte("occurred_at", fromDateISO)
    .lte("occurred_at", toDateISO)
    .order("occurred_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar transactions (admin):", error.message);
    return [];
  }

  return data;
}

export async function getAllProfessionals(): Promise<AdminProfessional[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, name, bio, photo_url, working_hours, active, display_order, professional_services(service_id)",
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar professionals (admin):", error.message);
    return [];
  }

  return data.map(({ professional_services, ...professional }) => ({
    ...professional,
    service_ids: (professional_services as { service_id: string }[]).map(
      (link) => link.service_id,
    ),
  }));
}

// Fila de conferência do sinal: reservas ainda no relógio, comprovantes
// avisados pelo cliente e reservas vencidas de horários que ainda não
// passaram (cliente que pagou atrasado). A ordem de urgência fica na tela.
export async function getPaymentQueue(): Promise<AdminAppointment[]> {
  await releaseExpiredReservations();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS)
    .or(
      `and(status.eq.pending,payment_status.in.(awaiting_payment,awaiting_confirmation)),and(payment_status.eq.expired,starts_at.gte.${new Date().toISOString()})`,
    )
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar fila de pagamentos (admin):", error.message);
    return [];
  }

  return data as unknown as AdminAppointment[];
}

// Pagamentos que o cliente disse ter feito e a equipe ainda não conferiu.
export async function countPaymentsAwaitingConfirmation(): Promise<number> {
  await releaseExpiredReservations();

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("payment_status", "awaiting_confirmation");

  if (error) {
    console.error("Erro ao contar pagamentos pendentes:", error.message);
    return 0;
  }

  return count ?? 0;
}
