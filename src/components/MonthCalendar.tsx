"use client";

import Link from "next/link";
import { useMemo } from "react";

type CalEvent = {
  id: string;
  datetimeStart: string;
  place: string;
  status: string;
  paid: boolean;
  bringEquipment: boolean;
  companion?: { id: string; name: string; color: string | null } | null;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function startOfGrid(monthStart: Date) {
  // Lunes como primer día (ES). JS: 0 domingo..6 sábado
  const day = (monthStart.getDay() + 6) % 7; // lunes=0
  const s = new Date(monthStart);
  s.setDate(s.getDate() - day);
  s.setHours(0, 0, 0, 0);
  return s;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export default function MonthCalendar({
  monthDate,
  events,
  linkBasePath,
}: {
  monthDate: Date;              // cualquier día del mes actual
  events: CalEvent[];
  linkBasePath: string;         // "/admin/events" o "/companion/events"
}) {
  const monthStart = useMemo(() => startOfMonth(monthDate), [monthDate]);
  const monthEnd = useMemo(() => endOfMonth(monthDate), [monthDate]);
  const gridStart = useMemo(() => startOfGrid(monthStart), [monthStart]);

  const days = useMemo(() => {
    // 6 semanas * 7 días = 42 celdas (calendario estable)
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [gridStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.datetimeStart);
      const key = ymd(d);
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    // orden por hora
    for (const [k, arr] of map) {
      arr.sort((a, b) => new Date(a.datetimeStart).getTime() - new Date(b.datetimeStart).getTime());
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const today = useMemo(() => new Date(), []);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(monthDate);
  }, [monthDate]);

  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 12 }}>
        {weekDays.map((w) => (
          <div key={w} style={{ fontSize: 12, fontWeight: 800, color: "#555", textAlign: "center" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 8 }}>
        {days.map((d) => {
          const inMonth = d >= monthStart && d <= monthEnd;
          const key = ymd(d);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = sameDay(d, today);

          return (
            <div
              key={key}
              style={{
                border: "1px solid #e3e3e3",
                borderRadius: 12,
                padding: 8,
                minHeight: 86,
                background: inMonth ? "white" : "#fafafa",
                opacity: inMonth ? 1 : 0.6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 13,
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: isToday ? "#111" : "transparent",
                    color: isToday ? "white" : "#111",
                    lineHeight: "18px",
                  }}
                >
                  {d.getDate()}
                </div>
                <div style={{ fontSize: 11, color: "#777" }}>{d.getMonth() + 1}</div>
              </div>

              <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                {dayEvents.slice(0, 4).map((ev) => {
                  const c = ev.companion?.color ?? "#999999";
                  const title = `${fmtTime(ev.datetimeStart)} · ${ev.place}`;
                  return (
                    <Link
                      key={ev.id}
                      href={`${linkBasePath}/${ev.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                      title={title}
                    >
                      <div
                        style={{
                          borderLeft: `6px solid ${c}`,
                          borderRadius: 10,
                          padding: "6px 8px",
                          background: "#f8f8f8",
                          fontSize: 12,
                          lineHeight: "14px",
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>{fmtTime(ev.datetimeStart)}</div>
                        <div style={{ color: "#333", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.place}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {dayEvents.length > 4 && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    +{dayEvents.length - 4} más…
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
        Mes: <b style={{ textTransform: "capitalize" }}>{monthLabel}</b>
      </div>
    </div>
  );
}