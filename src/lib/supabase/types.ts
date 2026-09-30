// Tipos manuais espelhando supabase/migrations/20260828120000_schema_fase1.sql
// e 20260926120000_profissionais_duracao_cabelo.sql.
// Cobrem só as colunas usadas pelo site público por enquanto.

import type { HairLength } from "@/lib/hair-length";

export type BusinessHours = Record<
  string,
  { open: string; close: string } | { closed: true }
>;

export interface BusinessSettings {
  id: string;
  name: string;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  business_hours: BusinessHours;
}

export interface HairDuration {
  hair_length: HairLength;
  duration_minutes: number;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  // Duração fixa. Se hair_durations tiver linhas, é ela que vale e o cliente
  // informa o tamanho do cabelo no agendamento.
  duration_minutes: number;
  image_url: string | null;
  hair_durations: HairDuration[];
}

// Visão completa da tabela — usada só no painel (admin também vê inativos).
export interface AdminService extends Service {
  active: boolean;
  display_order: number;
}

// Versão pública (só ativos, sem horário próprio exposto além do necessário).
export interface Professional {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  working_hours: BusinessHours | null;
  service_ids: string[];
}

export interface AdminProfessional extends Professional {
  active: boolean;
  display_order: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  category: string | null;
}

export interface AdminGalleryPhoto extends GalleryPhoto {
  published: boolean;
  display_order: number;
}

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface AdminAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  hair_length: HairLength | null;
  client: { id: string; name: string; whatsapp: string | null } | null;
  service: { id: string; name: string; price: number } | null;
  professional: { id: string; name: string } | null;
}

export interface AdminBlockedSlot {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  // null = bloqueio do estúdio inteiro.
  professional: { id: string; name: string } | null;
}

export interface AdminClient {
  id: string;
  name: string;
  whatsapp: string | null;
  notes: string | null;
  created_at: string;
}

export type TransactionType = "income" | "expense";

export interface AdminTransaction {
  id: string;
  type: TransactionType;
  category: string | null;
  amount: number;
  description: string | null;
  occurred_at: string;
}
