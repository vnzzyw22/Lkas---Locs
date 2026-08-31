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

export async function getPublishedGalleryPhotos(): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id, url, category")
    .eq("published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar gallery_photos:", error.message);
    return [];
  }

  return data;
}
