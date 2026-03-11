"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Button, Card, Input, Label } from "@/components/ui";

type Companion = { id: string; name: string; color: string | null; active: boolean };
type FieldErrors = Partial<Record<"place" | "price" | "contactName", string>>;

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

function isValidNumber(value: string) {
  return value.trim() !== "" && !Number.isNaN(Number(value)) && Number(value) >= 0;
}

function fieldInputClass(hasError: boolean) {
  return hasError ? "border-red-500 ring-2 ring-red-100 focus:ring-red-200" : "";
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

  const [companionIds, setCompanionIds] = useState<string[]>([]);
  const [companionPrices, setCompanionPrices] = useState<Record<string, string>>({});
  const [bringEquipment, setBringEquipment] = useState(false);
  const [status, setStatus] = useState<"pending" | "confirmed" | "cancelled" | "done">("pending");
  const [paid, setPaid] = useState(false);
  const [notesAdmin, setNotesAdmin] = useState("");

  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (place.trim().length < 2) nextErrors.place = "El sitio es obligatorio (mínimo 2 caracteres).";
    if (!isValidNumber(price)) nextErrors.price = "El precio total es obligatorio y debe ser válido.";
    if (contactName.trim().length < 2) nextErrors.contactName = "El nombre del contacto es obligatorio.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleCompanionSelection(nextIds: string[]) {
    setCompanionIds(nextIds);
    setCompanionPrices((prev) => {
      const next: Record<string, string> = {};
      for (const id of nextIds) next[id] = prev[id] ?? "";
      return next;
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setSaving(true);

    const dt = new Date(`${date}T${time}:00`);
    const payload: any = {
      datetimeStart: dt.toISOString(),
      place: place.trim(),
      bringEquipment,
      status,
      paid,
      currency: "EUR",
      notesAdmin: notesAdmin || null,
      contactName: contactName.trim(),
      contactPhone: contactPhone || null,
      contactExtra: contactExtra || null,
      companionIds,
      price: Number(price),
      companionPricing: companionIds.map((companionId) => ({
        companionId,
        price: isValidNumber(companionPrices[companionId] ?? "") ? Number(companionPrices[companionId]) : null,
      })),
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
        <form onSubmit={onSave} className="grid gap-4" noValidate>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-black/5 p-3 text-[12px] text-[rgb(var(--muted))]">
            Los campos con <span className="font-bold text-red-600">*</span> son obligatorios.
          </div>

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
            <Label>
              Sitio <span className="text-red-600">*</span>
            </Label>
            <div className="mt-1">
              <Input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                aria-invalid={!!fieldErrors.place}
                className={fieldInputClass(!!fieldErrors.place)}
              />
            </div>
            {fieldErrors.place ? <p className="mt-1 text-[12px] font-semibold text-red-600">{fieldErrors.place}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>
                Precio total evento (€) <span className="text-red-600">*</span>
              </Label>
              <div className="mt-1">
                <Input
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-invalid={!!fieldErrors.price}
                  className={fieldInputClass(!!fieldErrors.price)}
                />
              </div>
              {fieldErrors.price ? <p className="mt-1 text-[12px] font-semibold text-red-600">{fieldErrors.price}</p> : null}
            </div>
            <div className="sm:col-span-1">
              <Label>Acompañantes</Label>
              <div className="mt-1">
                <select
                  multiple
                  value={companionIds}
                  onChange={(e) => handleCompanionSelection(Array.from(e.target.selectedOptions, (option) => option.value))}
                  className="h-40 w-full rounded-2xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-black/10"
                >
                  {companions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[12px] text-[rgb(var(--muted))]">Mantén Ctrl/Cmd para seleccionar varios.</p>
              </div>
            </div>
          </div>

          {companionIds.length > 0 ? (
            <div className="grid gap-3">
              <Label>Precio por acompañante (visible solo para cada acompañante)</Label>
              {companionIds.map((companionId) => {
                const companion = companions.find((c) => c.id === companionId);
                return (
                  <div key={companionId} className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="text-[14px] font-semibold">{companion?.name ?? "Acompañante"}</div>
                    <Input
                      inputMode="decimal"
                      placeholder="Ej: 80"
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
              <Label>
                Contacto (nombre) <span className="text-red-600">*</span>
              </Label>
              <div className="mt-1">
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  aria-invalid={!!fieldErrors.contactName}
                  className={fieldInputClass(!!fieldErrors.contactName)}
                />
              </div>
              {fieldErrors.contactName ? (
                <p className="mt-1 text-[12px] font-semibold text-red-600">{fieldErrors.contactName}</p>
              ) : null}
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

          <div className="grid gap-3 sm:grid-cols-2">
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
                rows={4}
                className="w-full rounded-2xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>

          {error && <div className="text-[13px] font-semibold text-red-600">{error}</div>}

          <Button disabled={saving} className="w-full sm:w-auto">
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
