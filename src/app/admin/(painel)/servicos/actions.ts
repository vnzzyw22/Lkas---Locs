"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { HAIR_LENGTHS, type HairLength } from "@/lib/hair-length";

interface ServiceInput {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  displayOrder: number;
  active: boolean;
  // null = duração fixa; preenchido = duração por tamanho do cabelo.
  hairDurations: Record<HairLength, number> | null;
  professionalIds: string[];
}

type ActionResult = { ok: true } | { ok: false; error: string };

function validate(input: ServiceInput): string | null {
  if (!input.name.trim()) return "Informe o nome do serviço.";
  if (!(input.price >= 0)) return "Preço inválido.";
  if (input.hairDurations) {
    const invalid = HAIR_LENGTHS.some(
      (length) =>
        !Number.isInteger(input.hairDurations?.[length]) ||
        !((input.hairDurations?.[length] ?? 0) > 0),
    );
    if (invalid) return "Informe a duração (em minutos) de cada tamanho.";
  } else if (!(input.durationMinutes > 0)) {
    return "Duração inválida.";
  }
  return null;
}

// Com duração por tamanho, a duração "fixa" vira o menor tempo — é o que
// aparece pra quem ainda lê só services.duration_minutes.
function fixedDuration(input: ServiceInput) {
  return input.hairDurations
    ? Math.min(...HAIR_LENGTHS.map((length) => input.hairDurations![length]))
    : input.durationMinutes;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/agendar");
  revalidatePath("/admin/servicos");
  revalidatePath("/admin/profissionais");
}

// Grava durações por tamanho e vínculo com profissionais (substitui o que
// havia). Chamado depois do insert/update do serviço em si.
async function saveServiceRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  serviceId: string,
  input: ServiceInput,
): Promise<string | null> {
  if (input.hairDurations) {
    const { error } = await supabase.from("service_hair_durations").upsert(
      HAIR_LENGTHS.map((length) => ({
        service_id: serviceId,
        hair_length: length,
        duration_minutes: input.hairDurations![length],
      })),
    );
    if (error) {
      console.error("Erro ao salvar service_hair_durations:", error.message);
      return "Serviço salvo, mas não foi possível salvar as durações por tamanho.";
    }
  } else {
    const { error } = await supabase
      .from("service_hair_durations")
      .delete()
      .eq("service_id", serviceId);
    if (error) {
      console.error("Erro ao limpar service_hair_durations:", error.message);
      return "Serviço salvo, mas não foi possível remover as durações por tamanho.";
    }
  }

  const { error: unlinkError } = await supabase
    .from("professional_services")
    .delete()
    .eq("service_id", serviceId);
  if (unlinkError) {
    console.error("Erro ao limpar professional_services:", unlinkError.message);
    return "Serviço salvo, mas não foi possível atualizar os profissionais.";
  }

  if (input.professionalIds.length > 0) {
    const { error: linkError } = await supabase
      .from("professional_services")
      .insert(
        input.professionalIds.map((professionalId) => ({
          professional_id: professionalId,
          service_id: serviceId,
        })),
      );
    if (linkError) {
      console.error("Erro ao salvar professional_services:", linkError.message);
      return "Serviço salvo, mas não foi possível atualizar os profissionais.";
    }
  }

  return null;
}

export async function createService(input: ServiceInput): Promise<ActionResult> {
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("services").insert({
    id,
    name: input.name.trim(),
    description: input.description.trim() || null,
    price: input.price,
    duration_minutes: fixedDuration(input),
    display_order: input.displayOrder,
    active: input.active,
  });

  if (error) {
    console.error("Erro ao criar service:", error.message);
    return { ok: false, error: "Não foi possível criar o serviço." };
  }

  const relationsError = await saveServiceRelations(supabase, id, input);
  revalidateAll();
  if (relationsError) return { ok: false, error: relationsError };
  return { ok: true };
}

export async function updateService(
  id: string,
  input: ServiceInput,
): Promise<ActionResult> {
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      price: input.price,
      duration_minutes: fixedDuration(input),
      display_order: input.displayOrder,
      active: input.active,
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar service:", error.message);
    return { ok: false, error: "Não foi possível salvar o serviço." };
  }

  const relationsError = await saveServiceRelations(supabase, id, input);
  revalidateAll();
  if (relationsError) return { ok: false, error: relationsError };
  return { ok: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "Esse serviço já tem agendamentos no histórico e não pode ser excluído — desative-o em vez disso.",
      };
    }
    console.error("Erro ao excluir service:", error.message);
    return { ok: false, error: "Não foi possível excluir o serviço." };
  }

  revalidateAll();
  return { ok: true };
}
