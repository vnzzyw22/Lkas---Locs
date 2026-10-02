"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createAppointment, getAvailability } from "@/app/agendar/actions";
import { todayISO } from "@/lib/date";
import { formatDuration, formatPrice } from "@/lib/format";
import { HAIR_LENGTH_LABELS, HAIR_LENGTHS, type HairLength } from "@/lib/hair-length";
import {
  resolveServiceDuration,
  timeRangeLabel,
  timeToStartsAtISO,
} from "@/lib/scheduling";
import { ServiceSelect } from "./service-select";
import type { Professional, Service } from "@/lib/supabase/types";

interface BookingFormProps {
  services: Service[];
  professionals: Professional[];
  preselectedServiceId?: string;
  // Sinal via Pix ligado nas Configurações (null = fluxo antigo, sem sinal).
  deposit: { amount: number; holdMinutes: number } | null;
}

// "any" = sem preferência de profissional (o sistema escolhe o primeiro livre).
const ANY_PROFESSIONAL = "any";

interface SlotPickerProps {
  serviceId: string;
  hairLength: HairLength | null;
  dateISO: string;
  professionalChoice: string;
  professionals: Professional[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  onSwitchProfessional: (id: string) => void;
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

// Mesmo visual dos blocos de horário — usado também nas opções de tamanho e
// de profissional, pra etapa nova parecer parte do mesmo formulário.
function choiceClass(selected: boolean) {
  return `rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
    selected
      ? "border-brand-red bg-brand-red text-white"
      : "border-transparent bg-white/[0.06] text-brand-smoke hover:border-brand-red hover:text-white hover:shadow-[0_0_12px_rgba(200,16,46,0.35)]"
  }`;
}

function SlotPicker({
  serviceId,
  hairLength,
  dateISO,
  professionalChoice,
  professionals,
  selectedTime,
  onSelect,
  onSwitchProfessional,
}: SlotPickerProps) {
  const [slotsByProfessional, setSlotsByProfessional] = useState<Record<
    string,
    string[]
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getAvailability(serviceId, hairLength, dateISO).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if ("error" in result) setError(result.error);
      else setSlotsByProfessional(result.slotsByProfessional);
    });

    return () => {
      cancelled = true;
    };
  }, [serviceId, hairLength, dateISO]);

  if (loading) return <p className="text-sm text-brand-smoke">Carregando horários...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!slotsByProfessional) return null;

  // Sem preferência: qualquer horário em que pelo menos um profissional
  // esteja livre durante todo o atendimento.
  const slots =
    professionalChoice === ANY_PROFESSIONAL
      ? [...new Set(Object.values(slotsByProfessional).flat())].sort()
      : (slotsByProfessional[professionalChoice] ?? []);

  if (slots.length === 0) {
    const alternatives =
      professionalChoice === ANY_PROFESSIONAL
        ? []
        : professionals.filter(
            (p) =>
              p.id !== professionalChoice &&
              (slotsByProfessional[p.id]?.length ?? 0) > 0,
          );

    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-brand-smoke">
          Nenhum horário disponível nessa data
          {professionalChoice !== ANY_PROFESSIONAL &&
            ` com ${professionals.find((p) => p.id === professionalChoice)?.name ?? "esse profissional"}`}
          .{" "}
          {alternatives.length === 0 && "Tente outro dia."}
        </p>
        {alternatives.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-brand-smoke">Tem horário com:</span>
            {alternatives.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSwitchProfessional(p.id)}
                className={choiceClass(false)}
              >
                {p.name} →
              </button>
            ))}
          </div>
        )}
      </div>
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
          className={choiceClass(selectedTime === slot)}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}

export interface SummaryRow {
  label: string;
  value: string;
}

// Resumo do que está sendo reservado — antes de enviar e na tela de sucesso.
// No celular cada item empilha (rótulo em cima do valor): lado a lado, a
// coluna de rótulos ("Duração estimada") espremia os valores e quebrava o
// horário ao meio ("09:00–" / "12:00").
export function BookingSummary({ rows }: { rows: SummaryRow[] }) {
  return (
    <dl className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left text-sm sm:grid sm:grid-cols-[auto_1fr] sm:gap-x-6 sm:gap-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5 sm:contents">
          <dt className="font-label text-xs font-bold tracking-widest text-brand-smoke uppercase">
            {row.label}
          </dt>
          <dd className="text-white">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function dateLabelPT(dateISO: string) {
  return new Date(`${dateISO}T00:00:00-03:00`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export function BookingForm({
  services,
  professionals,
  preselectedServiceId,
  deposit,
}: BookingFormProps) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(
    preselectedServiceId && services.some((s) => s.id === preselectedServiceId)
      ? preselectedServiceId
      : "",
  );
  const [hairLength, setHairLength] = useState<HairLength | null>(null);
  const [professionalChoice, setProfessionalChoice] = useState(ANY_PROFESSIONAL);
  const [dateISO, setDateISO] = useState("");
  const [time, setTime] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    whatsappLink: string | null;
    summary: SummaryRow[];
  } | null>(null);

  const selectedService = services.find((s) => s.id === serviceId);
  const asksHairLength = (selectedService?.hair_durations.length ?? 0) > 0;
  const hairOptions = HAIR_LENGTHS.flatMap((length) => {
    const rule = selectedService?.hair_durations.find(
      (d) => d.hair_length === length,
    );
    return rule ? [{ length, minutes: rule.duration_minutes }] : [];
  });

  const eligibleProfessionals = selectedService
    ? professionals.filter((p) => p.service_ids.includes(selectedService.id))
    : [];
  // Com um profissional só não há o que escolher: ele é a opção.
  const effectiveProfessional =
    eligibleProfessionals.length === 1
      ? eligibleProfessionals[0].id
      : professionalChoice;

  const durationMinutes = selectedService
    ? resolveServiceDuration(selectedService, hairLength)
    : null;
  const readyForDate =
    !!selectedService &&
    durationMinutes !== null &&
    eligibleProfessionals.length > 0;

  function handleServiceChange(id: string) {
    setServiceId(id);
    setHairLength(null);
    setTime(null);
    // Mantém a escolha de profissional só se ele também realiza o novo serviço.
    if (
      professionalChoice !== ANY_PROFESSIONAL &&
      !professionals
        .find((p) => p.id === professionalChoice)
        ?.service_ids.includes(id)
    ) {
      setProfessionalChoice(ANY_PROFESSIONAL);
    }
  }

  function handleHairLengthChange(length: HairLength) {
    setHairLength(length);
    setTime(null);
  }

  function handleProfessionalChange(id: string) {
    setProfessionalChoice(id);
    setTime(null);
  }

  function handleDateChange(value: string) {
    setDateISO(value);
    setTime(null);
  }

  function professionalLabel() {
    if (effectiveProfessional === ANY_PROFESSIONAL) {
      return "Primeiro disponível";
    }
    return (
      professionals.find((p) => p.id === effectiveProfessional)?.name ?? ""
    );
  }

  function buildSummary(professionalName: string, timeRange: string) {
    if (!selectedService || durationMinutes === null || !dateISO) return [];

    const rows: SummaryRow[] = [
      { label: "Serviço", value: selectedService.name },
      { label: "Profissional", value: professionalName },
    ];
    if (asksHairLength && hairLength) {
      rows.push({ label: "Tamanho", value: HAIR_LENGTH_LABELS[hairLength] });
    }
    rows.push(
      { label: "Duração estimada", value: formatDuration(durationMinutes) },
      { label: "Data", value: dateLabelPT(dateISO) },
      { label: "Horário", value: timeRange },
      { label: "Valor", value: formatPrice(selectedService.price) },
    );
    return rows;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !dateISO || !time) return;

    setSubmitting(true);
    setSubmitError(null);

    const result = await createAppointment({
      serviceId,
      hairLength: asksHairLength ? hairLength : null,
      professionalId: effectiveProfessional,
      dateISO,
      time,
      name,
      whatsapp,
      notes,
    });

    if (result.ok && result.paymentPath) {
      // Mantém o botão travado até a navegação terminar (evita reenvio).
      router.push(result.paymentPath);
      return;
    }

    setSubmitting(false);

    if (result.ok) {
      setSuccess({
        whatsappLink: result.whatsappLink,
        summary: buildSummary(result.professionalName, result.timeRange),
      });
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
        <div className="w-full">
          <BookingSummary rows={success.summary} />
        </div>
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

      {asksHairLength && (
        <fieldset className="flex flex-col gap-2">
          <legend className={`${labelClass} mb-2`}>
            Tamanho dos locs/cabelo
          </legend>
          <p className="-mt-1 text-xs text-brand-smoke">
            O tempo do atendimento depende do tamanho.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {hairOptions.map((option) => (
              <button
                key={option.length}
                type="button"
                aria-pressed={hairLength === option.length}
                onClick={() => handleHairLengthChange(option.length)}
                className={`flex flex-col items-center gap-0.5 ${choiceClass(hairLength === option.length)}`}
              >
                <span>{HAIR_LENGTH_LABELS[option.length]}</span>
                <span className="text-xs opacity-70">
                  {formatDuration(option.minutes)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {selectedService && eligibleProfessionals.length === 0 && (
        <p className="text-sm text-brand-smoke">
          No momento nenhum profissional está atendendo esse serviço pelo
          site. Fale com a gente pelo WhatsApp.
        </p>
      )}

      {selectedService &&
        durationMinutes !== null &&
        eligibleProfessionals.length > 1 && (
          <fieldset className="flex flex-col gap-2">
            <legend className={`${labelClass} mb-2`}>Profissional</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                type="button"
                aria-pressed={professionalChoice === ANY_PROFESSIONAL}
                onClick={() => handleProfessionalChange(ANY_PROFESSIONAL)}
                className={choiceClass(professionalChoice === ANY_PROFESSIONAL)}
              >
                Sem preferência
              </button>
              {eligibleProfessionals.map((professional) => (
                <button
                  key={professional.id}
                  type="button"
                  aria-pressed={professionalChoice === professional.id}
                  onClick={() => handleProfessionalChange(professional.id)}
                  className={choiceClass(professionalChoice === professional.id)}
                >
                  {professional.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

      {readyForDate && (
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
      )}

      {readyForDate && dateISO && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Horário</span>
          <p className="-mt-1 text-xs text-brand-smoke">
            Duração estimada: {formatDuration(durationMinutes)}
          </p>
          <SlotPicker
            key={`${serviceId}-${hairLength}-${dateISO}`}
            serviceId={serviceId}
            hairLength={asksHairLength ? hairLength : null}
            dateISO={dateISO}
            professionalChoice={effectiveProfessional}
            professionals={eligibleProfessionals}
            selectedTime={time}
            onSelect={setTime}
            onSwitchProfessional={handleProfessionalChange}
          />
        </div>
      )}

      {time && durationMinutes !== null && (
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

          <div className="flex flex-col gap-2">
            <span className={labelClass}>Resumo</span>
            <BookingSummary
              rows={buildSummary(
                professionalLabel(),
                timeRangeLabel(timeToStartsAtISO(dateISO, time), durationMinutes),
              )}
            />
          </div>

          {deposit && (
            <p className="rounded-lg border border-brand-red/40 bg-brand-red/[0.08] px-4 py-3 text-sm text-white">
              Para confirmar o horário é preciso um sinal de{" "}
              <strong className="font-bold">{formatPrice(deposit.amount)}</strong>{" "}
              via Pix. No próximo passo, seu horário fica reservado por{" "}
              {deposit.holdMinutes} minutos enquanto você paga.
            </p>
          )}

          {submitError && <p className="text-sm text-red-400">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-red px-6 py-4 text-sm font-bold tracking-widest text-white uppercase transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "Enviando..."
              : deposit
                ? "Reservar e pagar o sinal"
                : "Agendar"}
          </button>
        </>
      )}
    </form>
  );
}
