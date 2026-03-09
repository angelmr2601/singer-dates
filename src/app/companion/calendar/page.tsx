"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MonthCalendar from "@/components/MonthCalendar";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui";

function monthRange(d: Date) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  from.setHours(0, 0, 0, 0);

  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export default function CompanionCalendarPage() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const label = useMemo(() => {
    return new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(monthDate);
  }, [monthDate]);

  async function load() {
    setErr(null);
    setLoading(true);

    const meRes = await fetch("/api/me", { cache: "no-store" });
    const me = await meRes.json();
    if (!me?.user) return router.replace("/login");
    if (me.user.role !== "companion") return router.replace("/admin/agenda");

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
    <AppShell title="Calendario">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[14px] font-extrabold capitalize text-[rgb(var(--muted))]">
          {label}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex">
          <Button
            variant="ghost"
            onClick={() =>
              setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))
            }
          >
            ◀ Mes
          </Button>

          <Button variant="ghost" onClick={() => setMonthDate(new Date())}>
            Hoy
          </Button>

          <Button
            variant="ghost"
            onClick={() =>
              setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))
            }
          >
            Mes ▶
          </Button>
        </div>
      </div>

      {loading && <div className="text-[14px] text-[rgb(var(--muted))]">Cargando…</div>}
      {err && <div className="text-[14px] font-semibold text-red-600">{err}</div>}

      {!loading && !err && (
        <MonthCalendar
          monthDate={monthDate}
          events={events}
          linkBasePath="/companion/events"
        />
      )}
    </AppShell>
  );
}