"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

function fmt(iso: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(d);
  return { date, time };
}

export default function CompanionEventDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const meRes = await fetch("/api/me", { cache: "no-store" });
      const me = await meRes.json();
      if (!me?.user) return router.replace("/login");
      if (me.user.role !== "companion") return router.replace("/admin/agenda");

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
  }, [id, router]);

  if (!id) return <main style={{ padding: 16 }}>Cargando…</main>;
  if (loading) return <main style={{ padding: 16 }}>Cargando…</main>;
  if (err) return <main style={{ padding: 16, color: "crimson" }}>{err}</main>;
  if (!event) return <main style={{ padding: 16 }}>No encontrado</main>;

  const { date, time } = fmt(event.datetimeStart);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>Evento</h1>
        <button onClick={() => router.back()} style={{ padding: "10px 12px" }}>Volver</button>
      </header>

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 12, background: "white" }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          {date} · {time}
        </div>
        <div style={{ marginTop: 10 }}><b>Sitio:</b> {event.place}</div>
        <div style={{ marginTop: 6 }}><b>Equipo:</b> {event.bringEquipment ? "Sí" : "No"}</div>
        <div style={{ marginTop: 6 }}><b>Estado:</b> {event.status}</div>

        {(event.contactName || event.contactPhone || event.contactExtra) && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800 }}>Contacto</div>
            {event.contactName && <div><b>Nombre:</b> {event.contactName}</div>}
            {event.contactPhone && <div><b>Tel:</b> {event.contactPhone}</div>}
            {event.contactExtra && <div><b>Info:</b> {event.contactExtra}</div>}
          </div>
        )}
      </div>
    </main>
  );
}