"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";

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

export default function EventCard({
  event,
  href,
  priceMode = "total",
}: {
  event: any;
  href: string;
  priceMode?: "total" | "companion";
}) {
  const primaryCompanion = event.companions?.[0] ?? null;
  const color = primaryCompanion?.color ?? "#9CA3AF";
  const amount = priceMode === "companion" ? event.companionPrice : event.price;
  const price = amount === null || amount === undefined ? null : `${amount} ${event.currency}`;
  const companionLabel =
    event.companions?.length > 0
      ? event.companions.map((companion: any) => companion.name).join(", ")
      : "Sin acompañante";

  return (
    <Link href={href} className="block">
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.995]">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-[13px] font-extrabold text-[rgb(var(--muted))]">
                  {fmtDate(event.datetimeStart)} · {fmtTime(event.datetimeStart)}
                </div>
                <div className="mt-1 break-words text-[15px] font-extrabold">{event.place}</div>
              </div>

              <div className="text-[12px] font-semibold text-[rgb(var(--muted))] sm:text-right">{companionLabel}</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{event.status}</Badge>
              <Badge>{event.paid ? "Pagado" : "Pendiente"}</Badge>
              {event.bringEquipment ? <Badge>Equipo</Badge> : null}
              {price ? <Badge>{priceMode === "companion" ? `Cobro: ${price}` : price}</Badge> : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
