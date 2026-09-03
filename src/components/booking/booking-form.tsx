"use client";

import { useEffect, useState } from "react";
import { createAppointment, getAvailableSlots } from "@/app/agendar/actions";
import { todayISO } from "@/lib/date";
import { formatDuration, formatPrice } from "@/lib/format";
import { ServiceSelect } from "./service-select";
import type { Service } from "@/lib/supabase/types";

interface BookingFormProps {
  services: Service[];
  preselectedServiceId?: string;
}

interface SlotPickerProps {
  serviceId: string;
  dateISO: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

// Estilo compartilhado dos campos "Serviço"/"Data" (2026-09-03, redesign
// pedido pelo cliente para a identidade escura/premium da marca) — cinza
// bem escuro sobre o fundo preto da página, sem borda visível em repouso,
// borda vermelha só no foco. `[color-scheme:dark]` faz o Chrome/Firefox
// desenharem o ícone nativo do calendário (input date) e a lista do
// select em tema escuro — sem isso o ícone do calendário sai escuro
// sobre fundo escuro, quase invisível.
const fieldClass =
  "rounded-lg border border-transparent bg-white/[0.06] px-3 py-2.5 text-sm text-white [color-scheme:dark] transition-colors duration-200 outline-none focus:border-brand-red";

const labelClass =
  "font-label text-xs font-bold tracking-widest text-white uppercase";

function SlotPicker({
  serviceId,
  dateISO,
  selectedTime,
  onSelect,
}: SlotPickerProps) {
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getAvailableSlots(serviceId, dateISO).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if ("error" in result) setError(result.error);
      else setSlots(result.slots);
    });

    return () => {
      cancelled = true;
    };
  }, [serviceId, dateISO]);

  if (loading) return <p className="text-sm text-brand-smoke">Carregando horários...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!slots || slots.length === 0) {
    return (
      <p className="text-sm text-brand-smoke">
        Nenhum horário disponível nessa data. Tente outro dia.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          aria-pressed={selectedTime === slot}
          onClick={() => onSelect(slot)}
          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            selectedTime === slot
              ? "border-brand-red bg-brand-red text-white"
              : "border-transparent bg-white/[0.06] text-brand-smoke hover:border-brand-red hover:text-white hover:shadow-[0_0_12px_rgba(200,16,46,0.35)]"
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}

export function BookingForm({
  services,
  preselectedServiceId,
}: BookingFormProps) {
  const [serviceId, setServiceId] = useState(
    preselectedServiceId && services.some((s) => s.id === preselectedServiceId)
      ? preselectedServiceId
      : "",
  );
  const [dateISO, setDateISO] = useState("");
  const [time, setTime] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ whatsappLink: string | null } | null>(
    null,
  );

  function handleServiceChange(id: string) {
    setServiceId(id);
    setTime(null);
  }

  function handleDateChange(value: string) {
    setDateISO(value);
    setTime(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !dateISO || !time) return;

    setSubmitting(true);
    setSubmitError(null);

    const result = await createAppointment({
      serviceId,
      dateISO,
      time,
      name,
      whatsapp,
      notes,
    });

    setSubmitting(false);

    if (result.ok) {
      setSuccess({ whatsappLink: result.whatsappLink });
    } else {
      setSubmitError(result.error);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <h2 className="font-display text-lg font-bold text-white uppercase">
          Agendamento enviado!
        </h2>
        <p className="text-sm text-brand-smoke">
          Falta pouco: confirme o pedido pelo WhatsApp para garantir seu
          horário. Ele fica pendente até o retorno da Lkas Locs.
        </p>
        {success.whatsappLink && (
          <a
            href={success.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand-red px-6 py-3 text-sm font-bold tracking-wide text-white uppercase transition hover:opacity-90"
          >
            Confirmar no WhatsApp
          </a>
        )}
      </div>
    );
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span id="servico-label" className={labelClass}>
          Serviço
        </span>
        <ServiceSelect
          services={services}
          value={serviceId}
          onChange={handleServiceChange}
          buttonId="servico"
          labelId="servico-label"
          listboxId="servico-listbox"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="data" className={labelClass}>
          Data
        </label>
        <input
          id="data"
          type="date"
          required
          min={todayISO()}
          value={dateISO}
          onChange={(e) => handleDateChange(e.target.value)}
          className={fieldClass}
        />
      </div>

      {serviceId && dateISO && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Horário</span>
          <SlotPicker
            key={`${serviceId}-${dateISO}`}
            serviceId={serviceId}
            dateISO={dateISO}
            selectedTime={time}
            onSelect={setTime}
          />
        </div>
      )}

      {time && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className={labelClass}>
              Seu nome
            </label>
            <input
              id="nome"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="whatsapp" className={labelClass}>
              WhatsApp (com DDD)
            </label>
            <input
              id="whatsapp"
              type="tel"
              required
              placeholder="(44) 90000-0000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className={`${fieldClass} placeholder:text-brand-smoke/50`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="observacao" className={labelClass}>
              Observação (opcional)
            </label>
            <textarea
              id="observacao"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={fieldClass}
            />
          </div>

          {selectedService && (
            <p className="text-sm text-brand-smoke">
              Resumo: {selectedService.name} —{" "}
              {formatPrice(selectedService.price)} (
              {formatDuration(selectedService.duration_minutes)})
            </p>
          )}

          {submitError && <p className="text-sm text-red-400">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-red px-6 py-4 text-sm font-bold tracking-widest text-white uppercase transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Agendar"}
          </button>
        </>
      )}
    </form>
  );
}
