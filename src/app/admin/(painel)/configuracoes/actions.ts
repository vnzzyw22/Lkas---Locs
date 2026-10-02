"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidBusinessHours } from "@/lib/business-hours";
import { parseMoney } from "@/lib/deposit";
import type { BusinessHours } from "@/lib/supabase/types";

const BUSINESS_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

interface UpdateBusinessSettingsInput {
  name: string;
  whatsapp: string;
  instagram: string;
  address: string;
  // Textos do formulário; valor vazio desliga o sinal.
  depositAmount: string;
  pixKey: string;
  depositHoldMinutes: string;
  businessHours: BusinessHours;
}

type UpdateResult = { ok: true } | { ok: false; error: string };

export async function updateBusinessSettings(
  input: UpdateBusinessSettingsInput,
): Promise<UpdateResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Informe o nome do negócio." };

  if (!isValidBusinessHours(input.businessHours)) {
    return {
      ok: false,
      error: "Verifique os horários: abertura precisa ser antes do fechamento.",
    };
  }

  const depositText = input.depositAmount.trim();
  const depositAmount = depositText ? parseMoney(depositText) : 0;
  if (depositAmount === null || depositAmount > 10_000) {
    return { ok: false, error: "Valor do sinal inválido. Exemplo: 30,00" };
  }

  const pixKey = input.pixKey.trim();
  if (pixKey.length > 140) {
    return { ok: false, error: "Chave Pix longa demais." };
  }

  const holdMinutes = Number(input.depositHoldMinutes);
  if (!Number.isInteger(holdMinutes) || holdMinutes < 5 || holdMinutes > 240) {
    return {
      ok: false,
      error: "O tempo da reserva precisa ficar entre 5 e 240 minutos.",
    };
  }

  // Sinal ligado exige o que o cliente precisa pra pagar e avisar.
  if (depositAmount > 0) {
    if (!pixKey) {
      return { ok: false, error: "Informe a chave Pix para ligar o sinal." };
    }
    if (!input.whatsapp.trim()) {
      return {
        ok: false,
        error: "Informe o WhatsApp: é por ele que o cliente envia o comprovante.",
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("business_settings")
    .update({
      name,
      whatsapp: input.whatsapp.trim() || null,
      instagram: input.instagram.trim() || null,
      address: input.address.trim() || null,
      deposit_amount: depositAmount,
      pix_key: pixKey || null,
      deposit_hold_minutes: holdMinutes,
      business_hours: input.businessHours,
    })
    .eq("id", BUSINESS_SETTINGS_ID);

  if (error) {
    console.error("Erro ao atualizar business_settings:", error.message);
    return { ok: false, error: "Não foi possível salvar as configurações." };
  }

  revalidatePath("/");
  revalidatePath("/agendar");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/pagamentos");

  return { ok: true };
}
