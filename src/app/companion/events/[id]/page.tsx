"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Badge, Button, Card } from "@/components/ui";
import { getEventStatusLabel } from "@/lib/event-status";

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function CompanionEventDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const res = await fetch(`/api/events/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setErr("No se pudo cargar el evento");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEvent(data.event);
      setLoading(false);
    })();
  }, [id]);

  const summaryText = useMemo(() => {
    if (!event) return "";

    const parts = [
      `🎤 Evento`,
      `📅 ${formatDate(event.datetimeStart)}`,
      `🕒 ${formatTime(event.datetimeStart)}`,
      `📍 ${event.place}`,
      event.companionPrice ? `💶 Cobro: ${event.companionPrice} ${event.currency}` : null,
      event.contactName ? `👤 ${event.contactName}` : null,
      event.contactPhone ? `📞 ${event.contactPhone}` : null,
      `🎛️ Equipo: ${event.bringEquipment ? "Sí" : "No"}`,
    ].filter(Boolean);

    return parts.join("\n");
  }, [event]);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      alert("Resumen copiado");
    } catch {
      alert("No se pudo copiar");
    }
  }

  function openWhatsApp() {
    const text = encodeURIComponent(summaryText);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function openMaps() {
    if (!event?.place) return;
    const q = encodeURIComponent(event.place);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  function callContact() {
    if (!event?.contactPhone) return;
    window.location.href = `tel:${event.contactPhone}`;
  }

  if (loading) {
    return (
      <AppShell title="Evento" right={<Button variant="ghost" onClick={() => router.back()}>Volver</Button>}>
        <div className="text-[14px] text-[rgb(var(--muted))]">Cargando…</div>
      </AppShell>
    );
  }

  if (err || !event) {
    return (
      <AppShell title="Evento" right={<Button variant="ghost" onClick={() => router.back()}>Volver</Button>}>
        <div className="text-[14px] font-semibold text-red-600">{err ?? "No encontrado"}</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Evento" right={<Button variant="ghost" onClick={() => router.back()}>Volver</Button>}>
      <div className="grid gap-4">
        <Card>
          <div className="break-words text-[20px] font-extrabold tracking-tight sm:text-[22px]">
            {event.place}
          </div>
          <div className="mt-1 text-[14px] text-[rgb(var(--muted))]">
            {formatDate(event.datetimeStart)} · {formatTime(event.datetimeStart)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{getEventStatusLabel(event.status)}</Badge>
            <Badge>{event.bringEquipment ? "Con equipo" : "Sin equipo"}</Badge>
          </div>
        </Card>

        <Card>
          <div className="text-[15px] font-extrabold">Acciones rápidas</div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="ghost" onClick={callContact} disabled={!event.contactPhone}>Llamar</Button>
            <Button variant="ghost" onClick={openWhatsApp}>WhatsApp</Button>
            <Button variant="ghost" onClick={openMaps}>Maps</Button>
            <Button variant="ghost" onClick={copySummary}>Copiar</Button>
          </div>
        </Card>

        <Card>
          <div className="text-[15px] font-extrabold">Detalles</div>

          <div className="mt-4 grid gap-3 text-[14px]">
            <div>
              <div className="font-bold text-[rgb(var(--muted))]">Mi cobro</div>
              <div className="mt-1 break-words">{event.companionPrice ? `${event.companionPrice} ${event.currency}` : "—"}</div>
            </div>

            <div>
              <div className="font-bold text-[rgb(var(--muted))]">Contacto</div>
              <div className="mt-1 break-words">{event.contactName || "—"}</div>
            </div>

            <div>
              <div className="font-bold text-[rgb(var(--muted))]">Teléfono</div>
              <div className="mt-1 break-words">{event.contactPhone || "—"}</div>
            </div>

            <div>
              <div className="font-bold text-[rgb(var(--muted))]">Extra</div>
              <div className="mt-1 break-words">{event.contactExtra || "—"}</div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
