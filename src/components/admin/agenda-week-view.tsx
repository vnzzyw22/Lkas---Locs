"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createBlockedSlot,
  deleteBlockedSlot,
  updateAppointmentStatus,
} from "@/app/admin/(painel)/agenda/actions";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  fieldClass,
  filterButtonClass,
  labelClass,
} from "@/components/admin/theme";
import { formatPrice } from "@/lib/format";
import { getWhatsappLink } from "@/lib/whatsapp";
import { timeToStartsAtISO } from "@/lib/scheduling";
import type {
  AdminAppointment,
  AdminBlockedSlot,
  AppointmentStatus,
} from "@/lib/supabase/types";

interface AgendaWeekViewProps {
  weekStartISO: string;
  isCurrentWeek: boolean;
  appointments: AdminAppointment[];
  blockedSlots: AdminBlockedSlot[];
}

type Selection =
  | { kind: "appointment"; data: AdminAppointment }
  | { kind: "block"; data: AdminBlockedSlot }
  | null;

const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-green-400",
  cancelled: "bg-white/30",
};

function dateKeySP(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function addDaysISO(dateISO: string, days: number) {
  const date = new Date(`${dateISO}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayNumberLabel(dateISO: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${dateISO}T00:00:00`));
}

export function AgendaWeekView({
  weekStartISO,
  isCurrentWeek,
  appointments,
  blockedSlots,
}: AgendaWeekViewProps) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [blockDate, setBlockDate] = useState<string | null>(null);
  const [blockStart, setBlockStart] = useState("12:00");
  const [blockEnd, setBlockEnd] = useState("13:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => {
    const dateISO = addDaysISO(weekStartISO, i);
    return {
      dateISO,
      isToday: dateISO === dateKeySP(new Date().toISOString()),
      appointments: appointments
        .filter((a) => dateKeySP(a.starts_at) === dateISO)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
      blocks: blockedSlots
        .filter((b) => dateKeySP(b.starts_at) === dateISO)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    };
  });

  function goToWeek(anchorISO: string) {
    setSelection(null);
    router.push(`/admin/agenda?data=${anchorISO}`);
  }

  function openBlockForm(dateISO: string) {
    setSelection(null);
    setBlockDate(dateISO);
    setBlockError(null);
  }

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setStatusUpdating(true);
    setActionError(null);
    const result = await updateAppointmentStatus(id, status);
    setStatusUpdating(false);
    if (result.ok) {
      setSelection(null);
      router.refresh();
    } else {
      setActionError(result.error);
    }
  }

  async function handleCreateBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!blockDate) return;

    setBlockSubmitting(true);
    setBlockError(null);

    const result = await createBlockedSlot({
      startsAtISO: timeToStartsAtISO(blockDate, blockStart),
      endsAtISO: timeToStartsAtISO(blockDate, blockEnd),
      reason: blockReason,
    });

    setBlockSubmitting(false);

    if (result.ok) {
      setBlockDate(null);
      setBlockReason("");
      router.refresh();
    } else {
      setBlockError(result.error);
    }
  }

  async function handleDeleteBlock(id: string) {
    const result = await deleteBlockedSlot(id);
    if (result.ok) {
      setSelection(null);
      router.refresh();
    } else {
      setActionError(result.error);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToWeek(addDaysISO(weekStartISO, -7))}
          className={filterButtonClass(false)}
        >
          ← Semana anterior
        </button>
        <button
          type="button"
          onClick={() => goToWeek(new Date().toISOString().slice(0, 10))}
          className={filterButtonClass(isCurrentWeek)}
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => goToWeek(addDaysISO(weekStartISO, 7))}
          className={filterButtonClass(false)}
        >
          Próxima semana →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-7 lg:gap-2">
        {days.map((day) => (
          <div
            key={day.dateISO}
            className={`flex flex-col gap-2 rounded-lg border p-3 ${
              day.isToday
                ? "border-brand-red bg-brand-red/[0.06]"
                : "border-white/10 bg-[#1a1a1a]"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-nav text-[11px] font-bold tracking-widest text-white/50 uppercase">
                {WEEKDAY_LABELS[new Date(`${day.dateISO}T00:00:00`).getDay()]}
              </span>
              <span
                className={`font-nav text-xs font-bold ${day.isToday ? "text-brand-red" : "text-white/70"}`}
              >
                {dayNumberLabel(day.dateISO)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {day.appointments.map((appointment) => {
                const isSelected =
                  selection?.kind === "appointment" &&
                  selection.data.id === appointment.id;

                return (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() =>
                      setSelection({ kind: "appointment", data: appointment })
                    }
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors duration-150 ${
                      isSelected
                        ? "bg-brand-red text-white"
                        : "bg-white/[0.06] text-white/85 hover:bg-brand-red hover:text-white"
                    } ${appointment.status === "cancelled" ? "opacity-40 line-through" : ""}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[appointment.status]}`}
                    />
                    <span className="truncate">
                      {timeLabel(appointment.starts_at)}{" "}
                      {appointment.service?.name ?? "Serviço removido"}
                    </span>
                  </button>
                );
              })}

              {day.blocks.map((block) => {
                const isSelected =
                  selection?.kind === "block" && selection.data.id === block.id;

                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => setSelection({ kind: "block", data: block })}
                    className={`rounded-md border border-dashed px-2 py-1.5 text-left text-xs transition-colors duration-150 ${
                      isSelected
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/70"
                    }`}
                  >
                    {timeLabel(block.starts_at)} Bloqueado
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => openBlockForm(day.dateISO)}
              className="mt-auto self-start font-nav text-[11px] font-bold tracking-widest text-white/30 uppercase transition-colors duration-150 hover:text-brand-red"
            >
              + Bloquear
            </button>
          </div>
        ))}
      </div>

      {actionError && <p className="text-sm text-red-400">{actionError}</p>}

      {selection?.kind === "appointment" && (
        <div className={`flex flex-col gap-3 ${cardClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-nav text-sm font-bold tracking-wide text-white uppercase">
                {selection.data.client?.name ?? "Cliente removido"}
              </p>
              <p className="mt-1 text-sm text-white/60">
                {selection.data.service?.name ?? "Serviço removido"}
                {selection.data.service && (
                  <> — {formatPrice(selection.data.service.price)}</>
                )}
              </p>
              <p className="mt-1 text-sm text-white/60">
                {timeLabel(selection.data.starts_at)}–
                {timeLabel(selection.data.ends_at)}
              </p>
              {selection.data.notes && (
                <p className="mt-1 text-sm text-white/40">
                  {selection.data.notes}
                </p>
              )}
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
              {STATUS_LABEL[selection.data.status]}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {selection.data.client?.whatsapp && (
              <a
                href={
                  getWhatsappLink(
                    selection.data.client.whatsapp,
                    `Olá, ${selection.data.client.name}! Sobre seu horário de ${timeLabel(selection.data.starts_at)} na Lkas Locs.`,
                  ) ?? undefined
                }
                target="_blank"
                rel="noopener noreferrer"
                className={buttonSecondaryClass}
              >
                WhatsApp
              </a>
            )}
            {selection.data.status === "pending" && (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => handleStatusChange(selection.data.id, "confirmed")}
                className={buttonPrimaryClass}
              >
                Confirmar
              </button>
            )}
            {selection.data.status !== "cancelled" && (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => handleStatusChange(selection.data.id, "cancelled")}
                className={buttonSecondaryClass}
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="font-nav text-xs font-bold tracking-widest text-white/40 uppercase hover:text-white"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {selection?.kind === "block" && (
        <div className={`flex flex-col gap-3 ${cardClass}`}>
          <p className="font-nav text-sm font-bold tracking-wide text-white uppercase">
            Bloqueio {timeLabel(selection.data.starts_at)}–
            {timeLabel(selection.data.ends_at)}
          </p>
          {selection.data.reason && (
            <p className="text-sm text-white/60">{selection.data.reason}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDeleteBlock(selection.data.id)}
              className={buttonSecondaryClass}
            >
              Remover bloqueio
            </button>
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="font-nav text-xs font-bold tracking-widest text-white/40 uppercase hover:text-white"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {blockDate && (
        <form
          onSubmit={handleCreateBlock}
          className={`flex flex-wrap items-end gap-3 ${cardClass}`}
        >
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Data</label>
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Início</label>
            <input
              type="time"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Fim</label>
            <input
              type="time"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="flex min-w-40 flex-1 flex-col gap-1.5">
            <label className={labelClass}>Motivo (opcional)</label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className={fieldClass}
            />
          </div>
          <button
            type="submit"
            disabled={blockSubmitting}
            className={buttonPrimaryClass}
          >
            {blockSubmitting ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setBlockDate(null)}
            className="font-nav text-xs font-bold tracking-widest text-white/40 uppercase hover:text-white"
          >
            Cancelar
          </button>
          {blockError && (
            <p className="w-full text-sm text-red-400">{blockError}</p>
          )}
        </form>
      )}
    </div>
  );
}
