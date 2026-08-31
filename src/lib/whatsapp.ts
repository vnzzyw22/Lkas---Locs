// Gera link wa.me com mensagem pré-preenchida. Sem integração de API — só o
// link de deep-link do WhatsApp (ver regras de negócio no CLAUDE.md).

export function getWhatsappLink(whatsapp: string | null, message: string) {
  if (!whatsapp) return null;

  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

interface BookingMessageParams {
  clientName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  notes?: string;
}

export function buildBookingMessage({
  clientName,
  serviceName,
  dateLabel,
  timeLabel,
  notes,
}: BookingMessageParams) {
  const lines = [
    `Olá! Meu nome é ${clientName} e acabei de solicitar um agendamento pelo site.`,
    `Serviço: ${serviceName}`,
    `Data: ${dateLabel}`,
    `Horário: ${timeLabel}`,
  ];

  if (notes) lines.push(`Observação: ${notes}`);
  lines.push("Aguardo a confirmação, obrigado(a)!");

  return lines.join("\n");
}
