import { HERO_GALLERY_CATEGORIES } from "@/lib/gallery-categories";
import type { BusyRange } from "@/lib/scheduling";
import { createClient } from "./server";
import type { BusinessSettings, GalleryPhoto, Service } from "./types";

// Leituras públicas do site (RLS: anon só vê o que é destinado ao público).
// Usadas em Server Components — sem cache manual, o Next já cuida do request.

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select("id, name, whatsapp, instagram, address, business_hours")
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
    .select("id, name, description, price, duration_minutes, image_url")
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
    .select("id, name, description, price, duration_minutes, image_url")
    .eq("active", true)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar service por id:", error.message);
    return null;
  }

  return data;
}

// Só starts_at/ends_at (ver supabase/migrations/20260901120000_busy_slots_view.sql)
// — nenhum dado do cliente/agendamento é exposto aqui.
export async function getBusySlots(
  fromISO: string,
  toISO: string,
): Promise<BusyRange[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("busy_slots")
    .select("starts_at, ends_at")
    .lt("starts_at", toISO)
    .gt("ends_at", fromISO);

  if (error) {
    console.error("Erro ao buscar busy_slots:", error.message);
    return [];
  }

  return data.map((row) => ({ startsAt: row.starts_at, endsAt: row.ends_at }));
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
