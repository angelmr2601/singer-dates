"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "short" }).format(d);
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export default function EventCard({ event, href }: { event: any; href: string }) {
  const color = event.companion?.color ?? "#9CA3AF";
  const price =
    event.price === null || event.price === undefined ? null : `${event.price} ${event.currency}`;

  return (
    <Link href={href} className="block">
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.995]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black px-2 py-1 text-[12px] font-extrabold text-white">
                {fmtDate(event.datetimeStart)} · {fmtTime(event.datetimeStart)}
              </span>
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="truncate text-[12px] font-semibold text-[rgb(var(--muted))]">
                {event.companion?.name ?? "Sin acompañante"}
              </span>
            </div>

            <div className="mt-2 truncate text-[15px] font-extrabold">{event.place}</div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{event.status}</Badge>
              <Badge>{event.paid ? "Pagado" : "Pendiente"}</Badge>
              {event.bringEquipment ? <Badge>Equipo</Badge> : null}
              {price ? <Badge>{price}</Badge> : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}