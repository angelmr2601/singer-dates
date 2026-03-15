"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import EventCard from "@/components/EventCard";

export default function CompanionAgenda() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/events", { cache: "no-store" });
      const data = await res.json();
      setEvents(data.events ?? []);
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const visibleEvents = events.filter((event) => {
    if (event.status === "done") return false;
    return new Date(event.datetimeStart) >= now;
  });

  return (
    <AppShell title="Mi agenda">
      {loading ? (
        <div className="text-[14px] text-[rgb(var(--muted))]">Cargando…</div>
      ) : (
        <div className="grid gap-3">
          {visibleEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} href={`/companion/events/${ev.id}`} priceMode="companion" />
          ))}
          {!visibleEvents.length && (
            <div className="text-[14px] text-[rgb(var(--muted))]">No tienes eventos.</div>
          )}
        </div>
      )}
    </AppShell>
  );
}
