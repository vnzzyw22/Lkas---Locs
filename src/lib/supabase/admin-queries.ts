import { createClient } from "./server";
import type { AdminService } from "./types";

// Leituras administrativas: exigem sessão autenticada (RLS via policies
// "_admin_all"). Usar só dentro de src/app/admin/**.

export async function getAllServices(): Promise<AdminService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, description, price, duration_minutes, image_url, active, display_order",
    )
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar services (admin):", error.message);
    return [];
  }

  return data;
}
