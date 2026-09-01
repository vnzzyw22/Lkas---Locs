"use client";

import { useEffect, useState } from "react";
import { createAppointment, getAvailableSlots } from "@/app/agendar/actions";
import { todayISO } from "@/lib/date";
import { formatDuration, formatPrice } from "@/lib/format";
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

  if (loading) return <p className="text-sm text-neutral-500">Carregando horários...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!slots || slots.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
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
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            selectedTime === slot
              ? "border-brand-red bg-brand-red text-white"
              : "border-black/10 hover:border-brand-red"
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
      <div className="flex flex-col items-center gap-4 rounded-xl border border-black/5 p-8 text-center">
        <h2 className="text-lg font-semibold text-brand-black">
          Agendamento enviado!
        </h2>
        <p className="text-sm text-neutral-500">
          Falta pouco: confirme o pedido pelo WhatsApp para garantir seu
          horário. Ele fica pendente até o retorno da Lkas Locs.
        </p>
        {success.whatsappLink && (
          <a
            href={success.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
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
        <label htmlFor="servico" className="text-sm font-medium text-brand-black">
          Serviço
        </label>
        <select
          id="servico"
          required
          value={serviceId}
          onChange={(e) => handleServiceChange(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Selecione um serviço
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — {formatPrice(service.price)} (
              {formatDuration(service.duration_minutes)})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="data" className="text-sm font-medium text-brand-black">
          Data
        </label>
        <input
          id="data"
          type="date"
          required
          min={todayISO()}
          value={dateISO}
          onChange={(e) => handleDateChange(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>

      {serviceId && dateISO && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-brand-black">Horário</span>
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
            <label htmlFor="nome" className="text-sm font-medium text-brand-black">
              Seu nome
            </label>
            <input
              id="nome"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="whatsapp"
              className="text-sm font-medium text-brand-black"
            >
              WhatsApp (com DDD)
            </label>
            <input
              id="whatsapp"
              type="tel"
              required
              placeholder="(44) 90000-0000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="observacao"
              className="text-sm font-medium text-brand-black"
            >
              Observação (opcional)
            </label>
            <textarea
              id="observacao"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>

          {selectedService && (
            <p className="text-sm text-neutral-500">
              Resumo: {selectedService.name} —{" "}
              {formatPrice(selectedService.price)} (
              {formatDuration(selectedService.duration_minutes)})
            </p>
          )}

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Agendar"}
          </button>
        </>
      )}
    </form>
  );
}
