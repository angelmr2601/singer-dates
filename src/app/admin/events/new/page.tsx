"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Button, Card, Input, Label } from "@/components/ui";

type Companion = { id: string; name: string; color: string | null; active: boolean };

function toLocalDateValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function toLocalTimeValue(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function NewEventPage() {
  const router = useRouter();

  const now = useMemo(() => new Date(), []);
  const [date, setDate] = useState(toLocalDateValue(now));
  const [time, setTime] = useState(toLocalTimeValue(now));

  const [place, setPlace] = useState("");
  const [price, setPrice] = useState<string>("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactExtra, setContactExtra] = useState("");

  const [companionId, setCompanionId] = useState<string>("");
  const [bringEquipment, setBringEquipment] = useState(false);
  const [status, setStatus] = useState<"pending" | "confirmed" | "cancelled" | "done">("pending");
  const [paid, setPaid] = useState(false);
  const [notesAdmin, setNotesAdmin] = useState("");

  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me", { cache: "no-store" });
      const me = await meRes.json();
      if (!me?.user) return router.replace("/login");
      if (me.user.role !== "admin") return router.replace("/companion/agenda");

      const res = await fetch("/api/companions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCompanions((data.companions ?? []).filter((c: Companion) => c.active));
      }
      setLoading(false);
    })();
  }, [router]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const dt = new Date(`${date}T${time}:00`);
    const payload: any = {
      datetimeStart: dt.toISOString(),
      place,
      bringEquipment,
      status,
      paid,
      currency: "EUR",
      notesAdmin: notesAdmin || null,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactExtra: contactExtra || null,
      companionId: companionId ? companionId : null,
      price: price === "" ? null : Number(price),
    };

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "No se pudo guardar");
      return;
    }

    router.replace("/admin/agenda");
  }

  if (loading) {
    return (
      <AppShell title="Nuevo evento" right={<Button variant="ghost" onClick={() => router.back()}>Volver</Button>}>
        <div className="text-[14px] text-[rgb(var(--muted))]">Cargando…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Nuevo evento" right={<Button variant="ghost" onClick={() => router.back()}>Volver</Button>}>
      <Card>
        <form onSubmit={onSave} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <div className="mt-1">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Hora</Label>
              <div className="mt-1">
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Sitio</Label>
            <div className="mt-1">
              <Input value={place} onChange={(e) => setPlace(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Precio (€)</Label>
              <div className="mt-1">
                <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Acompañante</Label>
              <div className="mt-1">
                <select
                  value={companionId}
                  onChange={(e) => setCompanionId(e.target.value)}
                  className="w-full rounded-2xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="">(Sin acompañante)</option>
                  {companions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contacto (nombre)</Label>
              <div className="mt-1">
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Contacto (tel)</Label>
              <div className="mt-1">
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Info contacto (extra)</Label>
            <div className="mt-1">
              <Input value={contactExtra} onChange={(e) => setContactExtra(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estado</Label>
              <div className="mt-1">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-2xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="done">Realizado</option>
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-[14px] font-semibold">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-[rgb(var(--border))]"
                />
                Pagado
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-[14px] font-semibold">
            <input
              type="checkbox"
              checked={bringEquipment}
              onChange={(e) => setBringEquipment(e.target.checked)}
              className="h-4 w-4 rounded border-[rgb(var(--border))]"
            />
            Llevar equipo de música
          </label>

          <div>
            <Label>Notas (admin)</Label>
            <div className="mt-1">
              <textarea
                value={notesAdmin}
                onChange={(e) => setNotesAdmin(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>

          {error && <div className="text-[13px] font-semibold text-red-600">{error}</div>}

          <Button disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </form>
      </Card>
    </AppShell>
  );
}