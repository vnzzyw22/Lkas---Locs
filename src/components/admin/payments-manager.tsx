"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  confirmPayment,
  rejectPayment,
} from "@/app/admin/(painel)/pagamentos/actions";
import {
  badgeClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  linkDangerClass,
  sectionTitleClass,
} from "@/components/admin/theme";
import { appointmentStatusInfo, bookingCode } from "@/lib/deposit";
import { formatPrice } from "@/lib/format";
import { getWhatsappLink } from "@/lib/whatsapp";
import type { AdminAppointment } from "@/lib/supabase/types";

interface PaymentsManagerProps {
  queue: AdminAppointment[];
}

const TZ = "America/Sao_Paulo";

function clock(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

function day(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

interface Group {
  title: string;
  hint?: string;
  items: AdminAppointment[];
}

export function PaymentsManager({ queue }: PaymentsManagerProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(
    null,
  );

  const groups: Group[] = [
    {
      title: "Comprovante enviado — conferir",
      hint: "O cliente avisou que fez o Pix. Confirme só depois de ver o valor na conta.",
      items: queue.filter(
        (a) => a.status === "pending" && a.payment_status === "awaiting_confirmation",
      ),
    },
    {
      title: "Aguardando o Pix do cliente",
      hint: "Horário reservado por tempo limitado. Se o prazo vencer, o horário volta pra agenda.",
      items: queue.filter(
        (a) => a.status === "pending" && a.payment_status === "awaiting_payment",
      ),
    },
    {
      title: "Reservas expiradas",
      hint: "Venceram sem aviso de pagamento. Se o cliente pagou depois, confirmar reativa o horário — só funciona se ele ainda estiver livre.",
      items: queue.filter((a) => a.payment_status === "expired"),
    },
  ].filter((group) => group.items.length > 0);

  async function run(
    id: string,
    action: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>,
  ) {
    setBusyId(id);
    setError(null);
    try {
      const result = await action(id);
      if (result.ok) router.refresh();
      else setError({ id, message: result.error });
    } catch {
      setError({ id, message: "Falha de conexão. Tente de novo." });
    } finally {
      setBusyId(null);
    }
  }

  function handleReject(appointment: AdminAppointment) {
    const name = appointment.client?.name ?? "esse cliente";
    if (
      !confirm(
        `Cancelar o agendamento de "${name}"? O horário volta a ficar disponível.`,
      )
    ) {
      return;
    }
    void run(appointment.id, rejectPayment);
  }

  if (groups.length === 0) {
    return (
      <p className="mt-6 text-sm text-white/40">
        Nenhum pagamento aguardando conferência.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-3">
          <div>
            <h2 className={sectionTitleClass}>
              {group.title}{" "}
              <span className="text-white/40">({group.items.length})</span>
            </h2>
            {group.hint && (
              <p className="mt-1 text-xs text-white/50">{group.hint}</p>
            )}
          </div>

          {group.items.map((appointment) => {
            const info = appointmentStatusInfo(appointment);
            const busy = busyId === appointment.id;
            const whatsappLink = appointment.client?.whatsapp
              ? getWhatsappLink(
                  appointment.client.whatsapp,
                  `Olá, ${appointment.client.name}! Sobre o sinal do seu agendamento de ${day(appointment.starts_at)} às ${clock(appointment.starts_at)} (código ${bookingCode(appointment.id)}).`,
                )
              : null;

            return (
              <article
                key={appointment.id}
                className={`flex flex-col gap-3 ${cardClass}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-nav text-sm font-bold tracking-wide text-white uppercase">
                      {appointment.client?.name ?? "Cliente removido"}
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      {appointment.service?.name ?? "Serviço removido"}
                      {appointment.professional &&
                        ` · ${appointment.professional.name}`}
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      {day(appointment.starts_at)} — {clock(appointment.starts_at)}
                      –{clock(appointment.ends_at)}
                    </p>
                  </div>
                  <span className={badgeClass(info.tone)}>{info.label}</span>
                </div>

                <p className="font-label text-xs text-white/60">
                  Sinal:{" "}
                  <strong className="text-sm text-white">
                    {formatPrice(appointment.deposit_amount ?? 0)}
                  </strong>
                  {appointment.payment_status === "awaiting_confirmation" &&
                    appointment.payment_claimed_at &&
                    ` · cliente avisou às ${clock(appointment.payment_claimed_at)}`}
                  {appointment.payment_status === "awaiting_payment" &&
                    appointment.reservation_expires_at &&
                    ` · reserva até ${clock(appointment.reservation_expires_at)}`}
                  {` · código ${bookingCode(appointment.id)}`}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(appointment.id, confirmPayment)}
                    className={buttonPrimaryClass}
                  >
                    {busy ? "Aguarde..." : "Confirmar pagamento"}
                  </button>
                  {appointment.status === "pending" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleReject(appointment)}
                      className={buttonSecondaryClass}
                    >
                      Recusar / cancelar
                    </button>
                  )}
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`ml-auto ${linkDangerClass}`}
                    >
                      WhatsApp do cliente
                    </a>
                  )}
                </div>

                {error?.id === appointment.id && (
                  <p role="alert" className="text-sm text-red-400">
                    {error.message}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
