"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidBusinessHours } from "@/lib/business-hours";
import type { BusinessHours } from "@/lib/supabase/types";

// Fotos de profissional ficam no mesmo bucket público da galeria (mesmas
// policies: leitura pública, escrita só admin), numa pasta própria.
const BUCKET = "gallery";
const PHOTO_FOLDER = "profissionais";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface ProfessionalInput {
  name: string;
  bio: string;
  photoUrl: string | null;
  active: boolean;
  displayOrder: number;
  // null = segue o horário do estúdio.
  workingHours: BusinessHours | null;
  serviceIds: string[];
}

type ActionResult = { ok: true } | { ok: false; error: string };

function validate(input: ProfessionalInput): string | null {
  if (!input.name.trim()) return "Informe o nome do profissional.";
  if (input.workingHours && !isValidBusinessHours(input.workingHours)) {
    return "Verifique os horários: início precisa ser antes do fim.";
  }
  return null;
}

function revalidateAll() {
  revalidatePath("/agendar");
  revalidatePath("/admin/profissionais");
  revalidatePath("/admin/servicos");
  revalidatePath("/admin/agenda");
}

async function saveServices(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professionalId: string,
  serviceIds: string[],
): Promise<string | null> {
  const { error: unlinkError } = await supabase
    .from("professional_services")
    .delete()
    .eq("professional_id", professionalId);

  if (unlinkError) {
    console.error("Erro ao limpar professional_services:", unlinkError.message);
    return "Profissional salvo, mas não foi possível atualizar os serviços.";
  }

  if (serviceIds.length === 0) return null;

  const { error: linkError } = await supabase.from("professional_services").insert(
    serviceIds.map((serviceId) => ({
      professional_id: professionalId,
      service_id: serviceId,
    })),
  );

  if (linkError) {
    console.error("Erro ao salvar professional_services:", linkError.message);
    return "Profissional salvo, mas não foi possível atualizar os serviços.";
  }

  return null;
}

function toRow(input: ProfessionalInput) {
  return {
    name: input.name.trim(),
    bio: input.bio.trim() || null,
    photo_url: input.photoUrl,
    active: input.active,
    display_order: input.displayOrder,
    working_hours: input.workingHours,
  };
}

export async function createProfessional(
  input: ProfessionalInput,
): Promise<ActionResult> {
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("professionals")
    .insert({ id, ...toRow(input) });

  if (error) {
    console.error("Erro ao criar professional:", error.message);
    return { ok: false, error: "Não foi possível cadastrar o profissional." };
  }

  const servicesError = await saveServices(supabase, id, input.serviceIds);
  revalidateAll();
  if (servicesError) return { ok: false, error: servicesError };
  return { ok: true };
}

export async function updateProfessional(
  id: string,
  input: ProfessionalInput,
): Promise<ActionResult> {
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update(toRow(input))
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar professional:", error.message);
    return { ok: false, error: "Não foi possível salvar o profissional." };
  }

  const servicesError = await saveServices(supabase, id, input.serviceIds);
  revalidateAll();
  if (servicesError) return { ok: false, error: servicesError };
  return { ok: true };
}

export async function deleteProfessional(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("professionals").delete().eq("id", id);

  if (error) {
    // 23503 até o Postgres 17; a partir do 18, ON DELETE RESTRICT responde 23001.
    if (error.code === "23503" || error.code === "23001") {
      return {
        ok: false,
        error:
          "Esse profissional já tem agendamentos no histórico e não pode ser excluído — desative-o em vez disso.",
      };
    }
    console.error("Erro ao excluir professional:", error.message);
    return { ok: false, error: "Não foi possível excluir o profissional." };
  }

  revalidateAll();
  return { ok: true };
}

export async function uploadProfessionalPhoto(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "O arquivo precisa ser uma imagem." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, error: "Imagem muito grande (máx. 5MB)." };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${PHOTO_FOLDER}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) {
    console.error("Erro ao subir foto de profissional:", error.message);
    return { ok: false, error: "Não foi possível enviar a imagem." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, url: publicUrl };
}
