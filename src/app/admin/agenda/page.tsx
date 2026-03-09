"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui";
import EventCard from "@/components/EventCard";

export default function AdminAgenda() {
  const router = useRouter();
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

  return (
    <AppShell
      title="Agenda"
      right={
        <Button onClick={() => router.push("/admin/events/new")} className="px-3 py-2 text-[13px]">
          + Evento
        </Button>
      }
    >
      {loading ? (
        <div className="text-[14px] text-[rgb(var(--muted))]">Cargando…</div>
      ) : (
        <div className="grid gap-3">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} href={`/admin/events/${ev.id}`} />
          ))}
          {!events.length && (
            <div className="text-[14px] text-[rgb(var(--muted))]">No hay eventos.</div>
          )}
        </div>
      )}
    </AppShell>
  );
}