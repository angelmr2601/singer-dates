"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MonthCalendar from "@/components/MonthCalendar";

function monthRange(d: Date) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  from.setHours(0, 0, 0, 0);

  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export default function AdminCalendarPage() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const label = useMemo(() => {
    return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(monthDate);
  }, [monthDate]);

  async function load() {
    setErr(null);
    setLoading(true);

    const meRes = await fetch("/api/me", { cache: "no-store" });
    const me = await meRes.json();
    if (!me?.user) return router.replace("/login");
    if (me.user.role !== "admin") return router.replace("/companion/agenda");

    const { from, to } = monthRange(monthDate);
    const url = `/api/events?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      setErr("No se pudieron cargar eventos");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDate]);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Calendario</h1>
          <div style={{ marginTop: 6, color: "#555", textTransform: "capitalize" }}>{label}</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
            style={{ padding: "10px 12px" }}
          >
            ◀ Mes
          </button>
          <button
            onClick={() => setMonthDate(new Date())}
            style={{ padding: "10px 12px" }}
          >
            Hoy
          </button>
          <button
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
            style={{ padding: "10px 12px" }}
          >
            Mes ▶
          </button>

          <button onClick={() => router.push("/admin/agenda")} style={{ padding: "10px 12px" }}>
            Agenda
          </button>
        </div>
      </header>

      {loading && <p style={{ marginTop: 16 }}>Cargando…</p>}
      {err && <p style={{ marginTop: 16, color: "crimson" }}>{err}</p>}

      {!loading && !err && (
        <MonthCalendar monthDate={monthDate} events={events} linkBasePath="/admin/events" />
      )}
    </main>
  );
}