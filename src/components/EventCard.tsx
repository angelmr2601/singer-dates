"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";

export type AgendaEvent = {
  id: string;
  datetimeStart: string;
  place: string;
  status: string;
  paid: boolean;
  bringEquipment: boolean;
  price?: number | null;
  currency?: string | null;
  companion?: { name?: string | null; color?: string | null } | null;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const same = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  if (same(d, today)) return "Hoy";
  if (same(d, tomorrow)) return "Mañana";
  return null;
}

export default function EventCard({ event, href }: { event: AgendaEvent; href: string }) {
  const color = event.companion?.color ?? "#9CA3AF";
  const price =
    event.price === null || event.price === undefined
      ? null
      : `${event.price} ${event.currency ?? ""}`.trim();
  const relativeDay = dayLabel(event.datetimeStart);

  return (
    <Link href={href} className="block">
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.995]">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[13px] font-extrabold text-[rgb(var(--muted))]">
                  <span>
                    {fmtDate(event.datetimeStart)} · {fmtTime(event.datetimeStart)}
                  </span>
                  {relativeDay ? <Badge className="bg-black text-white">{relativeDay}</Badge> : null}
                </div>
                <div className="mt-1 break-words text-[15px] font-extrabold">{event.place}</div>
              </div>

              <div className="text-[12px] font-semibold text-[rgb(var(--muted))] sm:text-right">
                {event.companion?.name ?? "Sin acompañante"}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="capitalize">{event.status}</Badge>
              <Badge className={event.paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                {event.paid ? "Pagado" : "Pendiente"}
              </Badge>
              {event.bringEquipment ? <Badge>Equipo</Badge> : null}
              {price ? <Badge>{price}</Badge> : null}
              <span className="ml-auto text-[12px] font-bold text-[rgb(var(--muted))]">Ver detalle →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
