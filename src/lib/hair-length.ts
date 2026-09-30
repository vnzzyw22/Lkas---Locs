// Tamanhos de cabelo/locs que definem a duração dos serviços que dependem
// disso. Os valores batem com o CHECK de service_hair_durations.hair_length e
// appointments.hair_length (supabase/migrations/20260926120000_...). Os
// MINUTOS de cada tamanho não ficam aqui — são configurados por serviço no
// painel (Serviços → Editar).

export const HAIR_LENGTHS = ["short", "medium", "long", "very_long"] as const;

export type HairLength = (typeof HAIR_LENGTHS)[number];

export const HAIR_LENGTH_LABELS: Record<HairLength, string> = {
  short: "Curto",
  medium: "Médio",
  long: "Longo",
  very_long: "Muito longo",
};

export function isHairLength(value: unknown): value is HairLength {
  return HAIR_LENGTHS.includes(value as HairLength);
}
