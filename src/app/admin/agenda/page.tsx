"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Button, Input } from "@/components/ui";
import EventCard, { type AgendaEvent } from "@/components/EventCard";

export default function AdminAgenda() {
  const router = useRouter();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/events", { cache: "no-store" });
      const data = await res.json();
      setEvents(data.events ?? []);
      setLoading(false);
    })();
  }, []);

  const statuses = useMemo(() => {
    return Array.from(new Set(events.map((ev) => ev.status).filter(Boolean)));
  }, [events]);

  const visibleEvents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return events.filter((ev) => {
      const matchesQuery =
        !q ||
        ev.place.toLowerCase().includes(q) ||
        (ev.companion?.name ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || ev.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [events, query, statusFilter]);

  return (
    <AppShell
      title="Agenda"
      right={
        <Button onClick={() => router.push("/admin/events/new")} className="px-3 py-2 text-[13px]">
          + Evento
        </Button>
      }
    >
      <div className="mb-4 grid gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por lugar o acompañante"
          aria-label="Buscar eventos"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "primary" : "ghost"}
            className="px-3 py-1.5 text-[12px]"
            onClick={() => setStatusFilter("all")}
          >
            Todos
          </Button>

          {statuses.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "primary" : "ghost"}
              className="px-3 py-1.5 text-[12px] capitalize"
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>

        {!loading && (
          <div className="text-[12px] font-semibold text-[rgb(var(--muted))]">
            {visibleEvents.length} de {events.length} eventos visibles
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-[14px] text-[rgb(var(--muted))]">Cargando…</div>
      ) : (
        <div className="grid gap-3">
          {visibleEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} href={`/admin/events/${ev.id}`} />
          ))}
          {!visibleEvents.length && (
            <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-white p-6 text-[14px] text-[rgb(var(--muted))]">
              No hay eventos para ese filtro. Prueba con otro estado o borra la búsqueda.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
