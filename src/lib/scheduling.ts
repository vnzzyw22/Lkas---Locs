// Cálculo puro de horários disponíveis. Brasil usa fuso fixo (America/Sao_Paulo,
// UTC-3, sem horário de verão desde 2019) — por isso um offset fixo já é
// suficiente, sem precisar de lib de timezone.

import type { HairLength } from "@/lib/hair-length";
import type {
  BusinessHours,
  Professional,
  Service,
} from "@/lib/supabase/types";

const TIMEZONE_OFFSET = "-03:00";
const TIMEZONE = "America/Sao_Paulo";

export interface BusyRange {
  startsAt: string;
  endsAt: string;
  // null = vale pra todos (bloqueio do estúdio inteiro).
  professionalId: string | null;
}

interface ComputeAvailableSlotsParams {
  dateISO: string; // "2026-09-05"
  openTime: string | null; // "09:00", ou null se fechado no dia
  closeTime: string | null; // "19:00"
  durationMinutes: number;
  busyRanges: BusyRange[];
  stepMinutes?: number;
  nowEpochMs?: number; // horários antes de agora são descartados quando dateISO é hoje
}

function toEpochMs(dateISO: string, time: string) {
  return new Date(`${dateISO}T${time}:00${TIMEZONE_OFFSET}`).getTime();
}

function epochToTimeLabel(epochMs: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(new Date(epochMs));
}

export function computeAvailableSlots({
  dateISO,
  openTime,
  closeTime,
  durationMinutes,
  busyRanges,
  stepMinutes = 30,
  nowEpochMs,
}: ComputeAvailableSlotsParams): string[] {
  if (!openTime || !closeTime) return [];

  const dayStart = toEpochMs(dateISO, openTime);
  const dayEnd = toEpochMs(dateISO, closeTime);
  const durationMs = durationMinutes * 60_000;
  const stepMs = stepMinutes * 60_000;

  const busy = busyRanges.map((range) => ({
    start: new Date(range.startsAt).getTime(),
    end: new Date(range.endsAt).getTime(),
  }));

  const slots: string[] = [];
  for (
    let start = dayStart;
    start + durationMs <= dayEnd;
    start += stepMs
  ) {
    if (nowEpochMs && start < nowEpochMs) continue;

    const end = start + durationMs;
    const overlaps = busy.some((b) => start < b.end && end > b.start);
    if (!overlaps) slots.push(epochToTimeLabel(start));
  }

  return slots;
}

export function timeToStartsAtISO(dateISO: string, time: string) {
  return new Date(`${dateISO}T${time}:00${TIMEZONE_OFFSET}`).toISOString();
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function weekdayKeyFor(dateISO: string) {
  // new Date("YYYY-MM-DD") é interpretado como UTC meia-noite; como o fuso é
  // sempre -03:00, isso ainda cai no dia certo da semana no Brasil.
  const weekday = new Date(`${dateISO}T00:00:00Z`).getUTCDay();
  return WEEKDAY_KEYS[weekday];
}

export function timeRangeLabel(startsAtISO: string, durationMinutes: number) {
  const start = new Date(startsAtISO).getTime();
  return `${epochToTimeLabel(start)}–${epochToTimeLabel(start + durationMinutes * 60_000)}`;
}

// ---------------------------------------------------------------------------
// Múltiplos profissionais + duração pelo tamanho do cabelo
// ---------------------------------------------------------------------------

type DayHours = { open: string; close: string } | { closed: true } | undefined;

function openClose(entry: DayHours) {
  return entry && "open" in entry ? { open: entry.open, close: entry.close } : null;
}

// Horário do profissional no dia = interseção do horário do estúdio com o
// horário próprio dele (se tiver). Sem horário próprio, segue o do estúdio.
// "HH:MM" compara certo como string.
export function effectiveDayHours(
  businessHours: BusinessHours,
  professionalHours: BusinessHours | null,
  dateISO: string,
): { open: string; close: string } | null {
  const day = weekdayKeyFor(dateISO);
  const business = openClose(businessHours[day]);
  if (!business) return null;
  if (!professionalHours) return business;

  const own = openClose(professionalHours[day]);
  if (!own) return null;

  const open = own.open > business.open ? own.open : business.open;
  const close = own.close < business.close ? own.close : business.close;
  return open < close ? { open, close } : null;
}

// Duração do atendimento: se o serviço tem durações por tamanho configuradas,
// o tamanho é obrigatório e define a duração; senão vale a duração fixa.
// Retorna null quando o tamanho é exigido e não veio (ou não tem regra).
export function resolveServiceDuration(
  service: Pick<Service, "duration_minutes" | "hair_durations">,
  hairLength: HairLength | null,
): number | null {
  if (service.hair_durations.length === 0) return service.duration_minutes;
  if (!hairLength) return null;
  return (
    service.hair_durations.find((d) => d.hair_length === hairLength)
      ?.duration_minutes ?? null
  );
}

interface SlotsByProfessionalParams {
  dateISO: string;
  businessHours: BusinessHours;
  professionals: Pick<Professional, "id" | "working_hours">[];
  durationMinutes: number;
  busyRanges: BusyRange[];
  nowEpochMs?: number;
}

// Agendas independentes: cada profissional só é bloqueado pelos próprios
// agendamentos/folgas e pelos bloqueios do estúdio inteiro (professionalId null).
export function computeSlotsByProfessional({
  dateISO,
  businessHours,
  professionals,
  durationMinutes,
  busyRanges,
  nowEpochMs,
}: SlotsByProfessionalParams): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const professional of professionals) {
    const hours = effectiveDayHours(
      businessHours,
      professional.working_hours,
      dateISO,
    );

    result[professional.id] = computeAvailableSlots({
      dateISO,
      openTime: hours?.open ?? null,
      closeTime: hours?.close ?? null,
      durationMinutes,
      busyRanges: busyRanges.filter(
        (range) =>
          range.professionalId === null ||
          range.professionalId === professional.id,
      ),
      nowEpochMs,
    });
  }

  return result;
}
