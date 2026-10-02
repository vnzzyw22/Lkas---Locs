"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  claimPayment,
  refreshBookingPayment,
} from "@/app/agendar/pagamento/actions";
import type { PaymentSnapshot } from "@/lib/supabase/reservations";
import { BookingSummary, type SummaryRow } from "./booking-form";

interface PaymentPanelProps {
  bookingId: string;
  code: string;
  initial: PaymentSnapshot;
  amountLabel: string;
  holdMinutes: number;
  pixKey: string | null;
  summary: SummaryRow[];
  whatsappLink: string | null;
  professionalName: string | null;
  serviceName: string;
  whenLabel: string;
  durationLabel: string;
  businessName: string;
}

type Phase = "pay" | "review" | "confirmed" | "expired" | "cancelled";

// Reserva (status) + sinal (payment_status) -> o que o cliente precisa ver.
function phaseOf(snapshot: PaymentSnapshot): Phase {
  if (snapshot.status === "confirmed") return "confirmed";
  if (snapshot.status === "cancelled") {
    return snapshot.paymentStatus === "expired" ? "expired" : "cancelled";
  }
  return snapshot.paymentStatus === "awaiting_payment" ? "pay" : "review";
}

const POLL_MS = 15_000;

const labelClass =
  "font-label text-xs font-bold tracking-widest text-brand-smoke uppercase";

const primaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-full bg-brand-red px-6 py-4 text-center text-sm font-bold tracking-widest text-white uppercase transition hover:opacity-90";

const secondaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-full border border-white/20 px-6 py-4 text-center text-sm font-bold tracking-widest text-white uppercase transition hover:border-brand-red";

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PaymentPanel({
  bookingId,
  code,
  initial,
  amountLabel,
  holdMinutes,
  pixKey,
  summary,
  whatsappLink,
  professionalName,
  serviceName,
  whenLabel,
  durationLabel,
  businessName,
}: PaymentPanelProps) {
  const [snapshot, setSnapshot] = useState(initial);
  // Segundos passados desde que o `remainingSeconds` do servidor foi recebido:
  // a contagem anda a partir dele, sem depender de a hora do celular estar certa.
  const [elapsed, setElapsed] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  // O botão do WhatsApp é um link comum (o navegador abre a conversa sem
  // depender da resposta do servidor). O aviso ao servidor vai junto; se o
  // celular suspender a aba ao trocar de app antes da resposta, repete ao voltar.
  const clickedRef = useRef(false);
  const ackedRef = useRef(false);

  const phase = phaseOf(snapshot);

  const applySnapshot = useCallback((next: PaymentSnapshot | null) => {
    if (!next) return;
    setSnapshot(next);
    setElapsed(0);
  }, []);

  const refresh = useCallback(async () => {
    try {
      applySnapshot(await refreshBookingPayment(bookingId));
    } catch {
      // Rede instável: mantém o estado atual e tenta de novo no próximo ciclo.
    }
  }, [applySnapshot, bookingId]);

  const sendClaim = useCallback(async () => {
    try {
      const result = await claimPayment(bookingId);

      if (result === "error") {
        setClaimNotice(
          "Não conseguimos registrar o aviso agora, mas é só enviar o comprovante pelo WhatsApp que a equipe confere.",
        );
        return;
      }

      ackedRef.current = true;

      if (result === "slot_taken") {
        setClaimNotice(
          "Esse horário já foi reservado por outra pessoa. Se você já fez o Pix, mande o comprovante pelo WhatsApp e a equipe resolve com você.",
        );
        return;
      }

      setClaimNotice(null);
      await refresh();
    } catch {
      setClaimNotice(
        "Não conseguimos registrar o aviso agora, mas é só enviar o comprovante pelo WhatsApp que a equipe confere.",
      );
    }
  }, [bookingId, refresh]);

  function handleClaimClick() {
    clickedRef.current = true;
    ackedRef.current = false;
    void sendClaim();
  }

  // Contagem regressiva (só enquanto a reserva está no relógio). Quando o
  // tempo acaba, pergunta ao servidor — que libera a reserva vencida e devolve
  // o novo estado (o snapshot muda e este efeito reinicia).
  useEffect(() => {
    if (phase !== "pay" || snapshot.remainingSeconds === null) return;

    const total = snapshot.remainingSeconds;
    const start = Date.now();
    const timer = setInterval(() => {
      const passed = Math.floor((Date.now() - start) / 1000);
      setElapsed(passed);
      if (total - passed <= 0) {
        clearInterval(timer);
        void refresh();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, snapshot, refresh]);

  const remaining =
    phase === "pay" && snapshot.remainingSeconds !== null
      ? Math.max(0, snapshot.remainingSeconds - elapsed)
      : null;

  // Acompanha o estado: a equipe pode confirmar enquanto a tela está aberta.
  useEffect(() => {
    if (phase === "confirmed" || phase === "cancelled") return;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [phase, refresh]);

  // Ao voltar do app do banco / WhatsApp: repete o aviso que ficou pendente
  // e atualiza o estado.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (clickedRef.current && !ackedRef.current) void sendClaim();
      else void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh, sendClaim]);

  async function copyPixKey() {
    if (!pixKey) return;
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopyState("copied");
    } catch {
      // Fallback pra navegadores/contextos sem Clipboard API.
      try {
        const field = document.createElement("textarea");
        field.value = pixKey;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(field);
        setCopyState(ok ? "copied" : "failed");
      } catch {
        setCopyState("failed");
      }
    }
    setTimeout(() => setCopyState("idle"), 3000);
  }

  const whatsappButton = (label: string, className: string) =>
    whatsappLink ? (
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClaimClick}
        className={className}
      >
        {label}
      </a>
    ) : (
      <p className="text-sm text-red-400">
        O WhatsApp da loja ainda não está configurado. Fale com a gente por
        outro canal para enviar o comprovante.
      </p>
    );

  const totalSeconds = holdMinutes * 60;

  return (
    <div className="flex flex-col gap-8" aria-live="polite">
      <header className="flex flex-col gap-3">
        <p className={labelClass}>
          {phase === "pay" ? "Reserva temporária" : "Agendamento"} · #{code}
        </p>

        {phase === "pay" && (
          <>
            <h1 className="font-display text-2xl font-black text-white uppercase sm:text-3xl">
              Seu horário foi <span className="text-brand-red">reservado</span>
            </h1>
            <p className="text-sm text-brand-smoke">
              {serviceName}
              {professionalName && ` · ${professionalName}`} · {whenLabel} ·{" "}
              {durationLabel}
            </p>
          </>
        )}

        {phase === "review" && (
          <>
            <h1 className="font-display text-2xl font-black text-white uppercase sm:text-3xl">
              Comprovante <span className="text-brand-red">enviado?</span>
            </h1>
            <p className="text-sm leading-relaxed text-brand-smoke">
              Seu agendamento está aguardando a confirmação da equipe. Assim
              que o pagamento for conferido, seu horário será confirmado.
            </p>
          </>
        )}

        {phase === "confirmed" && (
          <>
            <h1 className="font-display text-2xl font-black text-white uppercase sm:text-3xl">
              Horário <span className="text-brand-red">confirmado</span>
            </h1>
            <p className="text-sm leading-relaxed text-brand-smoke">
              A equipe conferiu o seu Pix. Já pode chegar no horário combinado.
            </p>
          </>
        )}

        {phase === "expired" && (
          <>
            <h1 className="font-display text-2xl font-black text-white uppercase sm:text-3xl">
              A reserva <span className="text-brand-red">expirou</span>
            </h1>
            <p className="text-sm leading-relaxed text-brand-smoke">
              O tempo para pagar o sinal acabou e o horário voltou a ficar
              disponível. Se você já fez o Pix, use o botão abaixo e envie o
              comprovante: a equipe confere e, se o horário ainda estiver
              livre, confirma pra você.
            </p>
          </>
        )}

        {phase === "cancelled" && (
          <>
            <h1 className="font-display text-2xl font-black text-white uppercase sm:text-3xl">
              Agendamento <span className="text-brand-red">cancelado</span>
            </h1>
            <p className="text-sm leading-relaxed text-brand-smoke">
              Este agendamento foi cancelado pela equipe. Você pode escolher
              outro horário quando quiser.
            </p>
          </>
        )}
      </header>

      {phase === "pay" && (
        <>
          {remaining !== null && (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className={labelClass}>Reserva válida por</span>
                <span
                  className={`font-label text-lg font-bold tabular-nums ${
                    remaining <= 60 ? "text-brand-red" : "text-white"
                  }`}
                >
                  {formatClock(remaining)}
                </span>
              </div>
              <div
                className="h-1 w-full overflow-hidden bg-white/10"
                role="progressbar"
                aria-label="Tempo restante da reserva"
                aria-valuemin={0}
                aria-valuemax={totalSeconds}
                aria-valuenow={remaining}
              >
                <div
                  className="h-full bg-brand-red transition-[width] duration-1000 ease-linear"
                  style={{
                    width: `${Math.min(100, (remaining / totalSeconds) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-brand-smoke">
                Passado esse tempo sem o sinal, o horário volta a ficar
                disponível para outras pessoas.
              </p>
            </div>
          )}

          <section aria-labelledby="sinal-titulo" className="flex flex-col gap-2">
            <h2
              id="sinal-titulo"
              className="font-display text-lg font-bold text-white uppercase"
            >
              Falta apenas confirmar o sinal
            </h2>
            <p className="text-sm leading-relaxed text-brand-smoke">
              Para confirmar seu horário é necessário um sinal de{" "}
              <strong className="font-bold text-white">{amountLabel}</strong>.
              Faça o Pix com a chave abaixo e depois envie o comprovante pelo
              WhatsApp. Seu horário será confirmado pela equipe após a
              conferência do pagamento.
            </p>
          </section>

          <ol className="flex flex-col gap-6">
            <li className="flex gap-4">
              <StepMark n={1} />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h3 className="font-display text-sm font-bold text-white uppercase">
                  Faça o Pix
                </h3>
                <p className="text-sm text-brand-smoke">
                  Envie{" "}
                  <strong className="font-bold text-white">{amountLabel}</strong>{" "}
                  para a chave Pix abaixo.
                </p>
                {pixKey ? (
                  <div className="flex flex-col gap-2">
                    <span className={labelClass}>Chave Pix</span>
                    <p className="rounded-lg border border-dashed border-white/25 bg-white/[0.04] px-4 py-3 font-label text-base font-bold break-all text-white select-all">
                      {pixKey}
                    </p>
                    <button
                      type="button"
                      onClick={copyPixKey}
                      className={secondaryButtonClass}
                    >
                      Copiar chave Pix
                    </button>
                    <p role="status" className="min-h-5 text-sm">
                      {copyState === "copied" && (
                        <span className="text-green-400">Chave Pix copiada!</span>
                      )}
                      {copyState === "failed" && (
                        <span className="text-red-400">
                          Não deu para copiar sozinho. Toque na chave para
                          selecionar e copie manualmente.
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-400">
                    A chave Pix ainda não está configurada. Fale com a gente
                    pelo WhatsApp.
                  </p>
                )}
              </div>
            </li>

            <li className="flex gap-4">
              <StepMark n={2} />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h3 className="font-display text-sm font-bold text-white uppercase">
                  Confira o valor
                </h3>
                <p className="text-sm text-brand-smoke">
                  Antes de pagar, confira se o valor enviado é exatamente{" "}
                  <strong className="font-bold text-white">{amountLabel}</strong>.
                </p>
                <p className="font-display text-4xl font-black text-brand-red">
                  {amountLabel}
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <StepMark n={3} />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h3 className="font-display text-sm font-bold text-white uppercase">
                  Envie o comprovante
                </h3>
                <p className="text-sm leading-relaxed text-brand-smoke">
                  Depois de realizar o Pix, clique no botão abaixo. Você será
                  direcionado para o WhatsApp do {businessName} com os dados do
                  seu agendamento já preenchidos. Envie o comprovante do Pix junto
                  com a mensagem.
                </p>
                {whatsappButton(
                  "Já fiz o Pix — enviar comprovante",
                  primaryButtonClass,
                )}
              </div>
            </li>
          </ol>
        </>
      )}

      {phase === "review" && (
        <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400"
            />
            <p className="text-sm text-white">
              <span className={`${labelClass} mr-2`}>Status</span>
              Aguardando confirmação da equipe
            </p>
          </div>
          <p className="text-sm leading-relaxed text-brand-smoke">
            Esqueceu de anexar o comprovante? É só abrir a conversa de novo e
            enviar. A equipe confirma pelo WhatsApp assim que conferir o Pix.
          </p>
          {whatsappButton("Abrir o WhatsApp de novo", secondaryButtonClass)}
        </div>
      )}

      {phase === "expired" && (
        <div className="flex flex-col gap-3">
          {whatsappButton(
            "Já fiz o Pix — enviar comprovante",
            primaryButtonClass,
          )}
          <Link href="/agendar" className={secondaryButtonClass}>
            Escolher outro horário
          </Link>
        </div>
      )}

      {phase === "cancelled" && (
        <Link href="/agendar" className={primaryButtonClass}>
          Agendar novamente
        </Link>
      )}

      {claimNotice && (
        <p role="alert" className="text-sm leading-relaxed text-red-400">
          {claimNotice}
        </p>
      )}

      {phase !== "expired" && phase !== "cancelled" && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Resumo</span>
          <BookingSummary rows={summary} />
        </div>
      )}
    </div>
  );
}

function StepMark({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center border border-brand-red font-display text-sm font-black text-brand-red"
    >
      {n}
    </span>
  );
}
