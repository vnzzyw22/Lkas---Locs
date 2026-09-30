"use client";

import { fieldClass } from "@/components/admin/theme";
import { DAY_LABELS, DAY_ORDER } from "@/lib/business-hours";
import type { BusinessHours } from "@/lib/supabase/types";

// Editor de horário por dia da semana. Extraído de settings-form.tsx
// (2026-09-26) pra ser reaproveitado no horário próprio de cada profissional —
// mesmo formato jsonb nos dois lugares.

interface DayState {
  closed: boolean;
  open: string;
  close: string;
}

export type HoursState = Record<(typeof DAY_ORDER)[number], DayState>;

export function toHoursState(hours: BusinessHours): HoursState {
  const state = {} as HoursState;
  for (const day of DAY_ORDER) {
    const entry = hours[day];
    if (entry && "closed" in entry && entry.closed) {
      state[day] = { closed: true, open: "09:00", close: "18:00" };
    } else if (entry && "open" in entry) {
      state[day] = { closed: false, open: entry.open, close: entry.close };
    } else {
      state[day] = { closed: true, open: "09:00", close: "18:00" };
    }
  }
  return state;
}

export function toBusinessHours(state: HoursState): BusinessHours {
  const hours: BusinessHours = {};
  for (const day of DAY_ORDER) {
    const dayState = state[day];
    hours[day] = dayState.closed
      ? { closed: true }
      : { open: dayState.open, close: dayState.close };
  }
  return hours;
}

interface HoursEditorProps {
  hours: HoursState;
  onChange: (hours: HoursState) => void;
  openLabel?: string;
}

export function HoursEditor({
  hours,
  onChange,
  openLabel = "Aberto",
}: HoursEditorProps) {
  function updateDay(day: (typeof DAY_ORDER)[number], patch: Partial<DayState>) {
    onChange({ ...hours, [day]: { ...hours[day], ...patch } });
  }

  return (
    <>
      {DAY_ORDER.map((day) => (
        <div
          key={day}
          className="flex flex-wrap items-center gap-3 text-sm text-white/70"
        >
          <span className="w-20 shrink-0 text-white/50">{DAY_LABELS[day]}</span>

          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={!hours[day].closed}
              onChange={(e) => updateDay(day, { closed: !e.target.checked })}
            />
            {openLabel}
          </label>

          {!hours[day].closed && (
            <>
              <input
                type="time"
                value={hours[day].open}
                onChange={(e) => updateDay(day, { open: e.target.value })}
                className={fieldClass}
              />
              <span className="text-white/30">até</span>
              <input
                type="time"
                value={hours[day].close}
                onChange={(e) => updateDay(day, { close: e.target.value })}
                className={fieldClass}
              />
            </>
          )}
        </div>
      ))}
    </>
  );
}
