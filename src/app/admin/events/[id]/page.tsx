"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Badge, Button, Card } from "@/components/ui";

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

export default function AdminEventDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
      event.price ? `💶 Total: ${event.price} ${event.currency}` : null,
      event.companionPrice ? `🤝 Acompañante: ${event.companionPrice} ${event.currency}` : null,
      event.contactName ? `👤 ${event.contactName}` : null,
      event.contactPhone ? `📞 ${event.contactPhone}` : null,
      `🎛️ Equipo: ${event.bringEquipment ? "Sí" : "No"}`,
      event.companions?.length ? `🤝 ${event.companions.map((c: any) => c.name).join(", ")}` : null,
      event.notesAdmin ? `📝 ${event.notesAdmin}` : null,
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

  async function updateStatus(status: "pending" | "confirmed" | "cancelled" | "done") {
    if (!id) return;
    setUpdatingStatus(true);

    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setUpdatingStatus(false);

    if (!res.ok) {
      alert("No se pudo actualizar el estado");
      return;
    }

    const data = await res.json();
    setEvent(data.event);
  }

  async function onDelete() {
    if (!id) return;
    const ok = window.confirm("¿Seguro que quieres borrar este evento?");
    if (!ok) return;

    setDeleting(true);
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      alert("No se pudo borrar");
      return;
    }

    router.replace("/admin/agenda");
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="break-words text-[20px] font-extrabold tracking-tight sm:text-[22px]">
                {event.place}
              </div>
              <div className="mt-1 text-[14px] text-[rgb(var(--muted))]">
                {formatDate(event.datetimeStart)} · {formatTime(event.datetimeStart)}
              </div>
            </div>

            {event.companions?.[0]?.color ? (
              <div
                className="mt-1 h-4 w-4 shrink-0 rounded-full"
                style={{ background: event.companions[0].color }}
                title={event.companions?.map((c: any) => c.name).join(", ") ?? ""}
              />
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{event.status}</Badge>
            <Badge>{event.paid ? "Pagado" : "Pendiente"}</Badge>
            <Badge>{event.bringEquipment ? "Con equipo" : "Sin equipo"}</Badge>
            {event.price ? <Badge>Total: {event.price} {event.currency}</Badge> : null}
            {event.companionPrice ? <Badge>Acompañante: {event.companionPrice} {event.currency}</Badge> : null}
            {event.companions?.length ? <Badge>{event.companions.map((c: any) => c.name).join(", ")}</Badge> : <Badge>Sin acompañante</Badge>}
          </div>
        </Card>

        <Card>
          <div className="text-[15px] font-extrabold">Estado</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant={event.status === "pending" ? "primary" : "ghost"} onClick={() => updateStatus("pending")} disabled={updatingStatus}>
              Pendiente
            </Button>
            <Button variant={event.status === "confirmed" ? "primary" : "ghost"} onClick={() => updateStatus("confirmed")} disabled={updatingStatus}>
              Confirmado
            </Button>
            <Button variant={event.status === "cancelled" ? "primary" : "ghost"} onClick={() => updateStatus("cancelled")} disabled={updatingStatus}>
              Cancelado
            </Button>
            <Button variant={event.status === "done" ? "primary" : "ghost"} onClick={() => updateStatus("done")} disabled={updatingStatus}>
              Realizado
            </Button>
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

            <div>
              <div className="font-bold text-[rgb(var(--muted))]">Notas</div>
              <div className="mt-1 whitespace-pre-wrap break-words">{event.notesAdmin || "—"}</div>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={() => router.push(`/admin/events/${id}/edit`)}>
            Editar
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={deleting}>
            {deleting ? "Borrando…" : "Borrar"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}