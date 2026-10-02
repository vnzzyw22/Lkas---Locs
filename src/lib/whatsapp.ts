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
  professionalName?: string;
  hairLengthLabel?: string;
  dateLabel: string;
  timeLabel: string;
  notes?: string;
}

export function buildBookingMessage({
  clientName,
  serviceName,
  professionalName,
  hairLengthLabel,
  dateLabel,
  timeLabel,
  notes,
}: BookingMessageParams) {
  const lines = [
    "📱 *Lkas Locs | Solicitação de Agendamento*",
    "",
    `Salve! Meu nome é ${clientName} e acabei de mandar um pedido de agendamento pelo site. Dá uma ligada nos detalhes:`,
    "",
    `⚡ *Serviço:* ${serviceName}`,
  ];

  if (professionalName) lines.push(`✂️ *Profissional:* ${professionalName}`);
  if (hairLengthLabel) lines.push(`📏 *Tamanho:* ${hairLengthLabel}`);

  lines.push(`📅 *Data:* ${dateLabel}`, `⏰ *Horário:* ${timeLabel}`);

  if (notes) lines.push(`💬 *Observação:* ${notes}`);

  lines.push("", "No aguardo do retorno para fechar esse progresso. Tamo junto!👊🔥");

  return lines.join("\n");
}

interface PixProofMessageParams {
  clientName: string;
  code: string;
  serviceName: string;
  professionalName?: string | null;
  hairLengthLabel?: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  servicePriceLabel: string;
  depositLabel: string;
}

// Mensagem do "Já fiz o Pix": monta só com dados reais do agendamento. Não é
// enviada pelo sistema — abre no WhatsApp do cliente, que anexa o comprovante
// e decide quando mandar.
export function buildPixProofMessage({
  clientName,
  code,
  serviceName,
  professionalName,
  hairLengthLabel,
  dateLabel,
  timeLabel,
  durationLabel,
  servicePriceLabel,
  depositLabel,
}: PixProofMessageParams) {
  const lines = [
    "Olá! Acabei de realizar o Pix referente ao meu agendamento.",
    "",
    "*Meu agendamento:*",
    "",
    `Cliente: ${clientName}`,
    `Serviço: ${serviceName}`,
  ];

  if (professionalName) lines.push(`Profissional: ${professionalName}`);
  if (hairLengthLabel) lines.push(`Tamanho: ${hairLengthLabel}`);

  lines.push(
    `Data: ${dateLabel}`,
    `Horário: ${timeLabel}`,
    `Duração: ${durationLabel}`,
    `Valor do serviço: ${servicePriceLabel}`,
    `Sinal: ${depositLabel}`,
    `Código: ${code}`,
    "",
    "Estou enviando o comprovante do Pix em seguida.",
    "",
    "_Anexe o comprovante do Pix antes de enviar esta mensagem._",
  );

  return lines.join("\n");
}
