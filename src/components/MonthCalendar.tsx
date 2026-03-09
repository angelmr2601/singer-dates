"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function fmtLongDate(d: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default function MonthCalendar({
  monthDate,
  events,
  linkBasePath,
}: {
  monthDate: Date;
  events: CalEvent[];
  linkBasePath: string;
}) {
  const monthStart = useMemo(() => startOfMonth(monthDate), [monthDate]);
  const monthEnd = useMemo(() => endOfMonth(monthDate), [monthDate]);
  const gridStart = useMemo(() => startOfGrid(monthStart), [monthStart]);

  const days = useMemo(() => {
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

    for (const [k, arr] of map) {
      arr.sort(
        (a, b) =>
          new Date(a.datetimeStart).getTime() -
          new Date(b.datetimeStart).getTime()
      );
      map.set(k, arr);
    }

    return map;
  }, [events]);

  const today = useMemo(() => new Date(), []);
  const initialSelectedDay = useMemo(() => {
    const todayInMonth =
      today.getMonth() === monthDate.getMonth() &&
      today.getFullYear() === monthDate.getFullYear();

    return todayInMonth ? today : monthStart;
  }, [today, monthDate, monthStart]);

  const [selectedDay, setSelectedDay] = useState<Date>(initialSelectedDay);

  const selectedEvents = eventsByDay.get(ymd(selectedDay)) ?? [];
  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="grid gap-4">
      {/* CABECERA DIAS */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((w) => (
          <div
            key={w}
            className="text-center text-[11px] font-extrabold text-[rgb(var(--muted))] sm:text-[12px]"
          >
            {w}
          </div>
        ))}
      </div>

      {/* MOBILE: celdas compactas con puntos */}
      <div className="grid grid-cols-7 gap-1 sm:hidden">
        {days.map((d) => {
          const inMonth = d >= monthStart && d <= monthEnd;
          const isToday = sameDay(d, today);
          const isSelected = sameDay(d, selectedDay);
          const dayEvents = eventsByDay.get(ymd(d)) ?? [];

          return (
            <button
              key={ymd(d)}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={[
                "min-h-[56px] rounded-2xl border p-1 text-left transition",
                inMonth
                  ? "border-[rgb(var(--border))] bg-white"
                  : "border-[rgb(var(--border))] bg-black/[0.03] opacity-60",
                isSelected ? "ring-2 ring-black/15" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span
                  className={[
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-extrabold",
                    isToday ? "bg-black text-white" : "text-[rgb(var(--text))]",
                  ].join(" ")}
                >
                  {d.getDate()}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: ev.companion?.color ?? "#9CA3AF" }}
                  />
                ))}
                {dayEvents.length > 3 ? (
                  <span className="text-[9px] font-bold text-[rgb(var(--muted))]">
                    +{dayEvents.length - 3}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* MOBILE: lista del día seleccionado */}
      <div className="sm:hidden">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm">
          <div className="text-[14px] font-extrabold capitalize">
            {fmtLongDate(selectedDay)}
          </div>

          <div className="mt-3 grid gap-2">
            {selectedEvents.length === 0 ? (
              <div className="text-[13px] text-[rgb(var(--muted))]">
                No hay eventos este día.
              </div>
            ) : (
              selectedEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`${linkBasePath}/${ev.id}`}
                  className="block rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ background: ev.companion?.color ?? "#9CA3AF" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-extrabold text-[rgb(var(--muted))]">
                        {fmtTime(ev.datetimeStart)}
                      </div>
                      <div className="mt-1 break-words text-[14px] font-extrabold">
                        {ev.place}
                      </div>
                      <div className="mt-1 text-[12px] text-[rgb(var(--muted))]">
                        {ev.companion?.name ?? "Sin acompañante"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP/TABLET: calendario más completo */}
      <div className="hidden grid-cols-7 gap-2 sm:grid">
        {days.map((d) => {
          const inMonth = d >= monthStart && d <= monthEnd;
          const isToday = sameDay(d, today);
          const dayEvents = eventsByDay.get(ymd(d)) ?? [];

          return (
            <div
              key={ymd(d)}
              className={[
                "min-h-[110px] rounded-2xl border p-2",
                inMonth
                  ? "border-[rgb(var(--border))] bg-white"
                  : "border-[rgb(var(--border))] bg-black/[0.03] opacity-60",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span
                  className={[
                    "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[12px] font-extrabold",
                    isToday ? "bg-black text-white" : "text-[rgb(var(--text))]",
                  ].join(" ")}
                >
                  {d.getDate()}
                </span>
              </div>

              <div className="mt-2 grid gap-1">
                {dayEvents.slice(0, 4).map((ev) => (
                  <Link
                    key={ev.id}
                    href={`${linkBasePath}/${ev.id}`}
                    className="block rounded-xl bg-[rgb(var(--bg))] px-2 py-1.5 text-[11px] transition hover:bg-black/5"
                    style={{
                      borderLeft: `5px solid ${ev.companion?.color ?? "#9CA3AF"}`,
                    }}
                  >
                    <div className="font-extrabold">{fmtTime(ev.datetimeStart)}</div>
                    <div className="truncate">{ev.place}</div>
                  </Link>
                ))}

                {dayEvents.length > 4 ? (
                  <div className="px-1 text-[11px] font-bold text-[rgb(var(--muted))]">
                    +{dayEvents.length - 4} más
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}