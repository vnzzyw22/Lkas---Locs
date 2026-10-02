import { HERO_GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import type { BusyRange } from "@/lib/scheduling";
import { createClient } from "./server";
import type {
  BusinessSettings,
  GalleryPhoto,
  Professional,
  Service,
} from "./types";

// Durações por tamanho de cabelo vêm embutidas no serviço (vazio = duração fixa).
const SERVICE_COLUMNS =
  "id, name, description, price, duration_minutes, image_url, hair_durations:service_hair_durations(hair_length, duration_minutes)";

// Leituras públicas do site (RLS: anon só vê o que é destinado ao público).
// Usadas em Server Components — sem cache manual, o Next já cuida do request.

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select(
      "id, name, whatsapp, instagram, address, business_hours, deposit_amount, pix_key, deposit_hold_minutes",
    )
    .single();

  if (error) {
    console.error("Erro ao buscar business_settings:", error.message);
    return null;
  }

  return data;
}

export async function getActiveServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar services:", error.message);
    return [];
  }

  return data;
}

export async function getActiveServiceById(
  id: string,
): Promise<Service | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("active", true)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar service por id:", error.message);
    return null;
  }

  return data;
}

// Só intervalo + profissional (ver supabase/migrations/20260901120000_busy_slots_view.sql
// e 20260926120000_...) — nenhum dado do cliente/agendamento é exposto aqui.
export async function getBusySlots(
  fromISO: string,
  toISO: string,
): Promise<BusyRange[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("busy_slots")
    .select("starts_at, ends_at, professional_id")
    .lt("starts_at", toISO)
    .gt("ends_at", fromISO);

  if (error) {
    console.error("Erro ao buscar busy_slots:", error.message);
    return [];
  }

  return data.map((row) => ({
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    professionalId: row.professional_id,
  }));
}

// Profissionais ativos com a lista de serviços que cada um realiza (RLS: anon
// só vê ativos). Ordem = ordem de exibição do painel, que também é a ordem de
// preferência quando o cliente escolhe "qualquer profissional".
export async function getActiveProfessionals(): Promise<Professional[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, name, bio, photo_url, working_hours, professional_services(service_id)",
    )
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar professionals:", error.message);
    return [];
  }

  return data.map(({ professional_services, ...professional }) => ({
    ...professional,
    service_ids: professional_services.map((link) => link.service_id),
  }));
}

// Fotos com categoria "hero"/"topo" — só o leque/fileira da Hero.
export async function getHeroGalleryPhotos(): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id, url, category")
    .eq("published", true)
    .in("category", HERO_GALLERY_CATEGORIES)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar gallery_photos (hero):", error.message);
    return [];
  }

  return data;
}

// Todas as fotos publicadas, exceto as marcadas pra Hero (categoria
// null/"locs"/"tranças"/etc. — qualquer coisa que não seja "hero"/"topo").
export async function getPublicGalleryPhotos(): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id, url, category")
    .eq("published", true)
    .or(
      `category.is.null,category.not.in.(${HERO_GALLERY_CATEGORIES.join(",")})`,
    )
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar gallery_photos (galeria):", error.message);
    return [];
  }

  return data;
}
