export function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${rest}min`;
}

// Duração de um serviço pra exibição: fixa, ou a faixa entre o menor e o
// maior tempo quando ela depende do tamanho do cabelo.
export function formatServiceDuration(service: {
  duration_minutes: number;
  hair_durations: { duration_minutes: number }[];
}) {
  if (service.hair_durations.length === 0) {
    return formatDuration(service.duration_minutes);
  }

  const minutes = service.hair_durations.map((d) => d.duration_minutes);
  const min = Math.min(...minutes);
  const max = Math.max(...minutes);
  return min === max
    ? formatDuration(min)
    : `${formatDuration(min)} a ${formatDuration(max)}`;
}
