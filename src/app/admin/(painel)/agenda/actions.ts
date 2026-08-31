"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateAgenda() {
  revalidatePath("/admin/agenda");
  revalidatePath("/agendar");
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar status do appointment:", error.message);
    return { ok: false, error: "Não foi possível atualizar o agendamento." };
  }

  revalidateAgenda();
  return { ok: true };
}

interface CreateBlockedSlotInput {
  startsAtISO: string;
  endsAtISO: string;
  reason: string;
}

export async function createBlockedSlot(
  input: CreateBlockedSlotInput,
): Promise<ActionResult> {
  if (new Date(input.endsAtISO) <= new Date(input.startsAtISO)) {
    return { ok: false, error: "O horário final precisa ser depois do inicial." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("blocked_slots").insert({
    starts_at: input.startsAtISO,
    ends_at: input.endsAtISO,
    reason: input.reason.trim() || null,
  });

  if (error) {
    if (error.code === "23P01") {
      return {
        ok: false,
        error: "Esse horário conflita com um agendamento ou bloqueio existente.",
      };
    }
    console.error("Erro ao criar blocked_slot:", error.message);
    return { ok: false, error: "Não foi possível criar o bloqueio." };
  }

  revalidateAgenda();
  return { ok: true };
}

export async function deleteBlockedSlot(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("blocked_slots").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir blocked_slot:", error.message);
    return { ok: false, error: "Não foi possível remover o bloqueio." };
  }

  revalidateAgenda();
  return { ok: true };
}
