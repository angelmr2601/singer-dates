"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Button, Card, Input, Label } from "@/components/ui";

type Companion = { id: string; name: string; color: string | null; active: boolean; companionPrice?: number | null };

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
  const [companionPrice, setCompanionPrice] = useState<string>("");
  const [companionPrices, setCompanionPrices] = useState<Record<string, string>>({});

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactExtra, setContactExtra] = useState("");

  const [companionIds, setCompanionIds] = useState<string[]>([]);
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
      setCompanionPrice(ev.companionPrice ? String(ev.companionPrice) : "");

      setContactName(ev.contactName ?? "");
      setContactPhone(ev.contactPhone ?? "");
      setContactExtra(ev.contactExtra ?? "");

      const selectedCompanions = ev.companions ?? [];
      setCompanionIds(selectedCompanions.map((c: Companion) => c.id));
      setCompanionPrices(
        Object.fromEntries(selectedCompanions.map((c: Companion) => [c.id, c.companionPrice ? String(c.companionPrice) : ""])),
      );
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
      companionPrice: companionPrice === "" ? null : Number(companionPrice),
      companionIds,
      companionPricing: companionIds.map((companionId) => ({
        companionId,
        price: companionPrices[companionId] === "" ? null : Number(companionPrices[companionId]),
      })),
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
          <div className="grid gap-3 sm:grid-cols-2">
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Precio total evento (€)</Label>
              <div className="mt-1">
                <Input value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Precio base acompañante (€)</Label>
              <div className="mt-1">
                <Input value={companionPrice} onChange={(e) => setCompanionPrice(e.target.value)} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>Acompañantes</Label>
              <div className="mt-1">
                <select
                  multiple
                  value={companionIds}
                  onChange={(e) => setCompanionIds(Array.from(e.target.selectedOptions, (option) => option.value))}
                  className="h-40 w-full rounded-2xl border border-gray-200 px-3 py-2"
                >
                  {companions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {companionIds.length > 0 ? (
            <div className="grid gap-3">
              <Label>Precio por acompañante</Label>
              {companionIds.map((companionId) => {
                const companion = companions.find((c) => c.id === companionId);
                return (
                  <div key={companionId} className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="text-[14px] font-semibold">{companion?.name ?? "Acompañante"}</div>
                    <Input
                      inputMode="decimal"
                      value={companionPrices[companionId] ?? ""}
                      onChange={(e) =>
                        setCompanionPrices((prev) => ({
                          ...prev,
                          [companionId]: e.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>

          <div>
            <Label>Extra</Label>
            <div className="mt-1">
              <Input value={contactExtra} onChange={(e) => setContactExtra(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Estado</Label>
              <div className="mt-1">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2"
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
            Llevar equipo
          </label>

          <div>
            <Label>Notas</Label>
            <textarea
              value={notesAdmin}
              onChange={(e) => setNotesAdmin(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-gray-200 px-3 py-2"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button disabled={saving} className="w-full sm:w-auto">
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
