"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getActiveProfessionals,
  getActiveServiceById,
  getBusinessSettings,
  getBusySlots,
} from "@/lib/supabase/queries";
import {
  computeSlotsByProfessional,
  resolveServiceDuration,
  timeRangeLabel,
  timeToStartsAtISO,
} from "@/lib/scheduling";
import { HAIR_LENGTH_LABELS, isHairLength, type HairLength } from "@/lib/hair-length";
import { buildBookingMessage, getWhatsappLink } from "@/lib/whatsapp";

const MAX_DAYS_AHEAD = 60;

// Valor do seletor de profissional quando o cliente não tem preferência.
const ANY_PROFESSIONAL = "any";

function isValidFutureDate(dateISO: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return false;

  const today = new Date();
  const min = new Date(today.toDateString());
  const max = new Date(min);
  max.setDate(max.getDate() + MAX_DAYS_AHEAD);

  const date = new Date(`${dateISO}T00:00:00`);
  return date >= min && date <= max;
}

// Carrega tudo que o cálculo de disponibilidade precisa e calcula os horários
// livres de cada profissional que realiza o serviço. Usado tanto pra mostrar
// os horários quanto pra revalidar o horário escolhido na hora de gravar
// (o cliente pode ter ficado com a tela aberta enquanto outra pessoa agendou).
async function loadAvailability(
  serviceId: string,
  hairLength: HairLength | null,
  dateISO: string,
) {
  const [service, business, professionals] = await Promise.all([
    getActiveServiceById(serviceId),
    getBusinessSettings(),
    getActiveProfessionals(),
  ]);

  if (!service) return { ok: false, error: "Serviço não encontrado." } as const;
  if (!business) {
    return { ok: false, error: "Não foi possível carregar os horários." } as const;
  }

  const durationMinutes = resolveServiceDuration(service, hairLength);
  if (durationMinutes === null) {
    return { ok: false, error: "Informe o tamanho do cabelo." } as const;
  }

  const eligible = professionals.filter((p) => p.service_ids.includes(service.id));

  const busyRanges = await getBusySlots(
    `${dateISO}T00:00:00-03:00`,
    `${dateISO}T23:59:59-03:00`,
  );

  const slotsByProfessional = computeSlotsByProfessional({
    dateISO,
    businessHours: business.business_hours,
    professionals: eligible,
    durationMinutes,
    busyRanges,
    nowEpochMs: Date.now(),
  });

  return {
    ok: true,
    service,
    business,
    eligible,
    durationMinutes,
    slotsByProfessional,
  } as const;
}

export async function getAvailability(
  serviceId: string,
  hairLength: string | null,
  dateISO: string,
): Promise<
  | { durationMinutes: number; slotsByProfessional: Record<string, string[]> }
  | { error: string }
> {
  if (!isValidFutureDate(dateISO)) {
    return { error: "Escolha uma data válida (hoje até 60 dias à frente)." };
  }
  if (hairLength !== null && !isHairLength(hairLength)) {
    return { error: "Tamanho de cabelo inválido." };
  }

  const result = await loadAvailability(serviceId, hairLength, dateISO);
  if (!result.ok) return { error: result.error };

  return {
    durationMinutes: result.durationMinutes,
    slotsByProfessional: result.slotsByProfessional,
  };
}

interface CreateAppointmentInput {
  serviceId: string;
  hairLength: string | null;
  professionalId: string; // id ou "any"
  dateISO: string;
  time: string;
  name: string;
  whatsapp: string;
  notes?: string;
}

type CreateAppointmentResult =
  | {
      ok: true;
      whatsappLink: string | null;
      professionalName: string;
      timeRange: string;
    }
  | { ok: false; error: string };

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  const name = input.name.trim();
  const whatsapp = input.whatsapp.trim();
  const notes = input.notes?.trim() || undefined;
  const hairLength = input.hairLength;

  if (!name) return { ok: false, error: "Informe seu nome." };
  if (whatsapp.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Informe um WhatsApp válido com DDD." };
  }
  if (!isValidFutureDate(input.dateISO)) {
    return { ok: false, error: "Data inválida." };
  }
  if (!/^\d{2}:\d{2}$/.test(input.time)) {
    return { ok: false, error: "Horário inválido." };
  }
  if (hairLength !== null && !isHairLength(hairLength)) {
    return { ok: false, error: "Tamanho de cabelo inválido." };
  }

  const availability = await loadAvailability(
    input.serviceId,
    hairLength,
    input.dateISO,
  );
  if (!availability.ok) return { ok: false, error: availability.error };

  const { service, business, eligible, durationMinutes, slotsByProfessional } =
    availability;

  // Serviço sem regra por tamanho não guarda tamanho (a pergunta nem aparece).
  const storedHairLength = service.hair_durations.length > 0 ? hairLength : null;

  // Candidatos na ordem de preferência: o escolhido, ou — em "qualquer
  // profissional" — todos que realizam o serviço, na ordem do painel.
  const candidates =
    input.professionalId === ANY_PROFESSIONAL
      ? eligible
      : eligible.filter((p) => p.id === input.professionalId);

  if (candidates.length === 0) {
    return {
      ok: false,
      error: "Esse profissional não realiza o serviço escolhido.",
    };
  }

  const free = candidates.filter((p) =>
    slotsByProfessional[p.id]?.includes(input.time),
  );

  if (free.length === 0) {
    return {
      ok: false,
      error: "Esse horário não está mais disponível. Escolha outro.",
    };
  }

  const startsAt = timeToStartsAtISO(input.dateISO, input.time);
  const endsAt = new Date(
    new Date(startsAt).getTime() + durationMinutes * 60_000,
  ).toISOString();

  const supabase = await createClient();

  // Sem .select() no insert: clients não tem policy de SELECT pra anon (só
  // admin lê), e o Postgres aplica RLS de leitura também sobre o RETURNING
  // de um INSERT — pedir o retorno faria o insert falhar. Por isso o id é
  // gerado aqui e usado direto, sem precisar ler a linha de volta.
  const clientId = crypto.randomUUID();
  const { error: clientError } = await supabase
    .from("clients")
    .insert({ id: clientId, name, whatsapp });

  if (clientError) {
    console.error("Erro ao criar client:", clientError.message);
    return { ok: false, error: "Não foi possível enviar o agendamento." };
  }

  // Tenta cada profissional livre em ordem: se dois clientes disputam o mesmo
  // horário, a constraint do banco (23P01) barra o segundo e, em "qualquer
  // profissional", ele cai no próximo livre em vez de receber erro.
  let booked: (typeof free)[number] | null = null;
  for (const professional of free) {
    const { error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        client_id: clientId,
        service_id: service.id,
        professional_id: professional.id,
        hair_length: storedHairLength,
        starts_at: startsAt,
        ends_at: endsAt,
        status: "pending",
        notes: notes ?? null,
      });

    if (!appointmentError) {
      booked = professional;
      break;
    }

    if (appointmentError.code !== "23P01") {
      console.error("Erro ao criar appointment:", appointmentError.message);
      return { ok: false, error: "Não foi possível enviar o agendamento." };
    }
  }

  if (!booked) {
    return {
      ok: false,
      error: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro.",
    };
  }

  const dateLabel = new Date(`${input.dateISO}T00:00:00-03:00`).toLocaleDateString(
    "pt-BR",
    { timeZone: "America/Sao_Paulo" },
  );
  const timeRange = timeRangeLabel(startsAt, durationMinutes);

  const whatsappLink = getWhatsappLink(
    business.whatsapp,
    buildBookingMessage({
      clientName: name,
      serviceName: service.name,
      professionalName: eligible.length > 1 ? booked.name : undefined,
      hairLengthLabel: storedHairLength
        ? HAIR_LENGTH_LABELS[storedHairLength]
        : undefined,
      dateLabel,
      timeLabel: timeRange,
      notes,
    }),
  );

  return { ok: true, whatsappLink, professionalName: booked.name, timeRange };
}
