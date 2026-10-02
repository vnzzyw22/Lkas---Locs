import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PaymentPanel } from "@/components/booking/payment-panel";
import type { SummaryRow } from "@/components/booking/booking-form";
import { bookingCode, getDepositConfig } from "@/lib/deposit";
import { formatDuration, formatPrice } from "@/lib/format";
import { HAIR_LENGTH_LABELS, isHairLength } from "@/lib/hair-length";
import { timeRangeLabel } from "@/lib/scheduling";
import { getBusinessSettings } from "@/lib/supabase/queries";
import {
  getBookingPayment,
  toPaymentSnapshot,
} from "@/lib/supabase/reservations";
import { buildPixProofMessage, getWhatsappLink } from "@/lib/whatsapp";

// Link privado do cliente (o id é um UUID aleatório): não entra em busca.
export const metadata: Metadata = {
  title: "Sinal do agendamento",
  robots: { index: false, follow: false },
};

export default async function PagamentoPage(
  props: PageProps<"/agendar/pagamento/[id]">,
) {
  const { id } = await props.params;

  const [booking, business] = await Promise.all([
    getBookingPayment(id),
    getBusinessSettings(),
  ]);

  if (!booking) notFound();
  // Agendamento sem sinal (fluxo antigo): não há o que pagar aqui.
  if (booking.paymentStatus === "not_required") redirect("/agendar");

  const deposit = getDepositConfig(business);
  const amount = booking.depositAmount ?? deposit?.amount ?? 0;

  const durationMinutes = Math.round(
    (new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) /
      60_000,
  );
  const dateLabel = new Date(booking.startsAt).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  const startLabel = timeRangeLabel(booking.startsAt, durationMinutes).split(
    "–",
  )[0];
  const timeLabel = timeRangeLabel(booking.startsAt, durationMinutes);
  const code = bookingCode(booking.id);
  const hairLengthLabel = isHairLength(booking.hairLength)
    ? HAIR_LENGTH_LABELS[booking.hairLength]
    : undefined;

  const summary: SummaryRow[] = [{ label: "Serviço", value: booking.serviceName }];
  if (booking.professionalName) {
    summary.push({ label: "Profissional", value: booking.professionalName });
  }
  if (hairLengthLabel) summary.push({ label: "Tamanho", value: hairLengthLabel });
  summary.push(
    { label: "Data", value: dateLabel },
    { label: "Horário", value: timeLabel },
    { label: "Duração estimada", value: formatDuration(durationMinutes) },
    { label: "Valor do serviço", value: formatPrice(booking.servicePrice) },
  );

  // Dados reais gravados no agendamento — nada montado à mão.
  const whatsappLink = getWhatsappLink(
    business?.whatsapp ?? null,
    buildPixProofMessage({
      clientName: booking.clientName,
      code,
      serviceName: booking.serviceName,
      professionalName: booking.professionalName,
      hairLengthLabel,
      dateLabel,
      timeLabel: startLabel,
      durationLabel: formatDuration(durationMinutes),
      servicePriceLabel: formatPrice(booking.servicePrice),
      depositLabel: formatPrice(amount),
    }),
  );

  return (
    <div className="flex flex-1 flex-col bg-brand-ink">
      <main
        id="conteudo"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12"
      >
        <PaymentPanel
          bookingId={booking.id}
          code={code}
          initial={toPaymentSnapshot(booking)}
          amountLabel={formatPrice(amount)}
          holdMinutes={deposit?.holdMinutes ?? 15}
          pixKey={deposit?.pixKey ?? business?.pix_key ?? null}
          summary={summary}
          whatsappLink={whatsappLink}
          professionalName={booking.professionalName}
          serviceName={booking.serviceName}
          whenLabel={`${dateLabel} às ${startLabel}`}
          durationLabel={formatDuration(durationMinutes)}
          businessName={business?.name ?? "estúdio"}
        />
      </main>
    </div>
  );
}
