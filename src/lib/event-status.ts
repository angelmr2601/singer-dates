const EVENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Realizado",
};

export function getEventStatusLabel(status: string) {
  return EVENT_STATUS_LABELS[status] ?? status;
}

