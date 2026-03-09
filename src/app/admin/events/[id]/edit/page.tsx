"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [price, setPrice] = useState<string>("");

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactExtra, setContactExtra] = useState("");

  const [companionId, setCompanionId] = useState("");
  const [bringEquipment, setBringEquipment] = useState(false);
  const [status, setStatus] = useState("pending");
  const [paid, setPaid] = useState(false);
  const [notesAdmin, setNotesAdmin] = useState("");

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [evRes, compRes] = await Promise.all([
        fetch(`/api/events/${id}`, { cache: "no-store" }),
        fetch("/api/companions", { cache: "no-store" }),
      ]);

      const evData = await evRes.json();
      const ev = evData.event;

      const dt = new Date(ev.datetimeStart);
      setDate(toLocalDateValue(dt));
      setTime(toLocalTimeValue(dt));

      setPlace(ev.place ?? "");
      setPrice(ev.price ? String(ev.price) : "");

      setContactName(ev.contactName ?? "");
      setContactPhone(ev.contactPhone ?? "");
      setContactExtra(ev.contactExtra ?? "");

      setCompanionId(ev.companionId ?? "");
      setBringEquipment(!!ev.bringEquipment);
      setStatus(ev.status);
      setPaid(!!ev.paid);
      setNotesAdmin(ev.notesAdmin ?? "");

      if (compRes.ok) {
        const data = await compRes.json();
        setCompanions((data.companions ?? []).filter((c: Companion) => c.active));
      }

      setLoading(false);
    })();
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError(null);

    const dt = new Date(`${date}T${time}:00`);

    const payload = {
      datetimeStart: dt.toISOString(),
      place,
      price: price === "" ? null : Number(price),
      companionId: companionId || null,
      bringEquipment,
      status,
      paid,
      notesAdmin,
      contactName,
      contactPhone,
      contactExtra,
    };

    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "No se pudo guardar");
      return;
    }

    router.replace(`/admin/events/${id}`);
  }

  if (loading) {
    return (
      <AppShell title="Editar evento">
        <div className="text-sm text-gray-500">Cargando…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Editar evento" right={<Button variant="ghost" onClick={() => router.back()}>Volver</Button>}>
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
              <Input value={place} onChange={(e) => setPlace(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Precio</Label>
              <div className="mt-1">
                <Input value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Acompañante</Label>
              <div className="mt-1">
                <select
                  value={companionId}
                  onChange={(e) => setCompanionId(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Sin acompañante</option>
                  {companions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <Label>Contacto</Label>
            <div className="mt-1">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Teléfono</Label>
            <div className="mt-1">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <textarea
              value={notesAdmin}
              onChange={(e) => setNotesAdmin(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-3 py-2"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}