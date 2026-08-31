"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createBlockedSlot,
  deleteBlockedSlot,
  updateAppointmentStatus,
} from "@/app/admin/(painel)/agenda/actions";
import { timeToStartsAtISO } from "@/lib/scheduling";
import type {
  AdminAppointment,
  AdminBlockedSlot,
  AppointmentStatus,
} from "@/lib/supabase/types";

interface AgendaViewProps {
  dateISO: string;
  appointments: AdminAppointment[];
  blockedSlots: AdminBlockedSlot[];
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-neutral-100 text-neutral-500",
};

function shiftDate(dateISO: string, days: number) {
  const date = new Date(`${dateISO}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function AgendaView({
  dateISO,
  appointments,
  blockedSlots,
}: AgendaViewProps) {
  const router = useRouter();
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockStart, setBlockStart] = useState("12:00");
  const [blockEnd, setBlockEnd] = useState("13:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  function goToDate(nextDateISO: string) {
    router.push(`/admin/agenda?data=${nextDateISO}`);
  }

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setStatusUpdating(id);
    setError(null);
    const result = await updateAppointmentStatus(id, status);
    setStatusUpdating(null);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function handleCreateBlock(e: React.FormEvent) {
    e.preventDefault();
    setBlockSubmitting(true);
    setBlockError(null);

    const result = await createBlockedSlot({
      startsAtISO: timeToStartsAtISO(dateISO, blockStart),
      endsAtISO: timeToStartsAtISO(dateISO, blockEnd),
      reason: blockReason,
    });

    setBlockSubmitting(false);

    if (result.ok) {
      setShowBlockForm(false);
      setBlockReason("");
      router.refresh();
    } else {
      setBlockError(result.error);
    }
  }

  async function handleDeleteBlock(id: string) {
    const result = await deleteBlockedSlot(id);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => goToDate(shiftDate(dateISO, -1))}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          ← Dia anterior
        </button>
        <input
          type="date"
          value={dateISO}
          onChange={(e) => goToDate(e.target.value)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => goToDate(shiftDate(dateISO, 1))}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Próximo dia →
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-brand-black">Agendamentos</h2>

        {appointments.length === 0 && (
          <p className="text-sm text-neutral-500">
            Nenhum agendamento nessa data.
          </p>
        )}

        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm"
          >
            <span className="font-medium text-brand-black">
              {timeLabel(appointment.starts_at)}–{timeLabel(appointment.ends_at)}
            </span>
            <span>{appointment.client?.name ?? "Cliente removido"}</span>
            <span className="text-neutral-500">
              {appointment.service?.name ?? "Serviço removido"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[appointment.status]}`}
            >
              {STATUS_LABEL[appointment.status]}
            </span>
            {appointment.notes && (
              <span className="text-neutral-500">— {appointment.notes}</span>
            )}

            <div className="ml-auto flex gap-2">
              {appointment.status === "pending" && (
                <button
                  type="button"
                  disabled={statusUpdating === appointment.id}
                  onClick={() => handleStatusChange(appointment.id, "confirmed")}
                  className="rounded-full bg-brand-red px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Confirmar
                </button>
              )}
              {appointment.status !== "cancelled" && (
                <button
                  type="button"
                  disabled={statusUpdating === appointment.id}
                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-brand-black">Bloqueios</h2>
          <button
            type="button"
            onClick={() => setShowBlockForm((v) => !v)}
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            {showBlockForm ? "Cancelar" : "+ Bloquear horário"}
          </button>
        </div>

        {showBlockForm && (
          <form
            onSubmit={handleCreateBlock}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                Início
              </label>
              <input
                type="time"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">Fim</label>
              <input
                type="time"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
              />
            </div>
            <div className="flex flex-1 min-w-40 flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={blockSubmitting}
              className="rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {blockSubmitting ? "Salvando..." : "Salvar"}
            </button>
            {blockError && (
              <p className="w-full text-sm text-red-600">{blockError}</p>
            )}
          </form>
        )}

        {blockedSlots.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum bloqueio nessa data.</p>
        )}

        {blockedSlots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-sm"
          >
            <span className="font-medium text-brand-black">
              {timeLabel(slot.starts_at)}–{timeLabel(slot.ends_at)}
            </span>
            {slot.reason && (
              <span className="text-neutral-500">{slot.reason}</span>
            )}
            <button
              type="button"
              onClick={() => handleDeleteBlock(slot.id)}
              className="ml-auto text-neutral-500 hover:underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
