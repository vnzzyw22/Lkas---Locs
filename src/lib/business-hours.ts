import type { BusinessHours } from "@/lib/supabase/types";

export const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo",
};

const SCHEMA_DAY: Record<(typeof DAY_ORDER)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

// Formato schema.org (OpeningHoursSpecification) pro JSON-LD da home —
// dias fechados simplesmente não entram na lista (schema.org não tem um
// jeito de declarar "fechado", só omite o dia).
export function toSchemaOpeningHours(hours: BusinessHours) {
  return DAY_ORDER.filter((day) => {
    const entry = hours[day];
    return entry && "open" in entry;
  }).map((day) => {
    const entry = hours[day] as { open: string; close: string };
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAY[day]}`,
      opens: entry.open,
      closes: entry.close,
    };
  });
}

export function formatBusinessHours(hours: BusinessHours) {
  return DAY_ORDER.filter((day) => hours[day]).map((day) => {
    const entry = hours[day];
    const label = DAY_LABELS[day];

    if ("closed" in entry && entry.closed) {
      return { label, value: "Fechado" };
    }

    if ("open" in entry) {
      return { label, value: `${entry.open} – ${entry.close}` };
    }

    return { label, value: "—" };
  });
}
