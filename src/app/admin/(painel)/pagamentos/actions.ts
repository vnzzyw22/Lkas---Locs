"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { countPaymentsAwaitingConfirmation } from "@/lib/supabase/admin-queries";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidatePayments() {
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/pagamentos");
  revalidatePath("/agendar");
}

// A equipe conferiu o Pix na conta: pagamento e agendamento viram
// "confirmado", com data/hora e quem confirmou. Também reativa uma reserva
// que venceu antes do cliente pagar — a constraint de conflito do banco
// barra se o horário já foi ocupado nesse meio-tempo.
export async function confirmPayment(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre no painel de novo." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "confirmed",
      payment_status: "confirmed",
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: user.email ?? user.id,
    })
    .eq("id", id)
    .in("payment_status", [
      "awaiting_payment",
      "awaiting_confirmation",
      "expired",
    ])
    .or("status.eq.pending,payment_status.eq.expired")
    .select("id");

  if (error) {
    if (error.code === "23P01") {
      return {
        ok: false,
        error:
          "Esse horário já foi ocupado por outro agendamento depois que a reserva expirou. Fale com o cliente para escolher outro.",
      };
    }
    console.error("Erro ao confirmar pagamento:", error.message);
    return { ok: false, error: "Não foi possível confirmar o pagamento." };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      error:
        "Esse agendamento não está mais aguardando pagamento (já foi confirmado ou cancelado).",
    };
  }

  revalidatePayments();
  return { ok: true };
}

// Comprovante errado ou Pix não localizado: cancela o agendamento e libera o
// horário. (Pra só deixar pendente, basta não fazer nada.)
export async function rejectPayment(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("Erro ao recusar pagamento:", error.message);
    return { ok: false, error: "Não foi possível cancelar o agendamento." };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "Esse agendamento já não está pendente.",
    };
  }

  revalidatePayments();
  return { ok: true };
}

// Alimenta o contador do menu (o layout do painel não re-renderiza a cada
// navegação, então o menu pergunta de novo).
export async function getAwaitingPaymentsCount(): Promise<number> {
  return countPaymentsAwaitingConfirmation();
}
