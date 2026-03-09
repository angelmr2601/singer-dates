"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Button, Card, Input, Label } from "@/components/ui";

type Companion = {
  id: string;
  name: string;
  username: string;
  color: string | null;
  active: boolean;
};

export default function AdminCompanionsPage() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [color, setColor] = useState("#FFAA00");

  const [tempPass, setTempPass] = useState<string | null>(null);
  const [tempPassUser, setTempPassUser] = useState<string | null>(null);
  const [loadingResetId, setLoadingResetId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toggleActiveId, setToggleActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Record<string, { name: string; color: string }>>({});

  async function load() {
    const res = await fetch("/api/companions", { cache: "no-store" });
    const data = await res.json();
    const list = data.companions ?? [];
    setCompanions(list);

    const nextDrafts: Record<string, { name: string; color: string }> = {};
    for (const c of list) {
      nextDrafts[c.id] = {
        name: c.name ?? "",
        color: c.color ?? "#999999",
      };
    }
    setDrafts(nextDrafts);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCompanion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/companions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, color, generateTempPassword: true }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error ?? "No se pudo crear el acompañante");
      return;
    }

    setTempPass(data.tempPassword ?? null);
    setTempPassUser(username);

    setName("");
    setUsername("");
    await load();
  }

  async function resetPassword(id: string, username: string) {
    setError(null);
    setLoadingResetId(id);

    const res = await fetch(`/api/companions/${id}/reset-password`, {
      method: "POST",
    });

    const data = await res.json().catch(() => ({}));
    setLoadingResetId(null);

    if (!res.ok) {
      setError(data?.error ?? "No se pudo resetear la contraseña");
      return;
    }

    setTempPass(data.tempPassword ?? null);
    setTempPassUser(username);
  }

  async function saveCompanion(id: string) {
    setError(null);
    setSavingId(id);

    const draft = drafts[id];
    const res = await fetch(`/api/companions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        color: draft.color,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSavingId(null);

    if (!res.ok) {
      setError(data?.error ?? "No se pudo guardar");
      return;
    }

    await load();
  }

  async function toggleActive(companion: Companion) {
    setError(null);
    setToggleActiveId(companion.id);

    const res = await fetch(`/api/companions/${companion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        active: !companion.active,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setToggleActiveId(null);

    if (!res.ok) {
      setError(data?.error ?? "No se pudo actualizar el estado");
      return;
    }

    await load();
  }

  async function copyPassword() {
    if (!tempPass) return;
    try {
      await navigator.clipboard.writeText(tempPass);
      alert("Contraseña copiada");
    } catch {
      alert("No se pudo copiar");
    }
  }

  return (
    <AppShell title="Acompañantes">
      <div className="grid gap-4">
        <Card>
          <form onSubmit={createCompanion} className="grid gap-3">
            <div className="text-[15px] font-extrabold">Nuevo acompañante</div>

            <div>
              <Label>Nombre</Label>
              <div className="mt-1">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Usuario</Label>
              <div className="mt-1">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Color</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200"
              />
            </div>

            <Button className="w-full sm:w-auto">Crear acompañante</Button>
          </form>
        </Card>

        {tempPass && tempPassUser && (
          <Card>
            <div className="text-[15px] font-extrabold">Contraseña temporal</div>
            <div className="mt-2 text-[14px] text-[rgb(var(--muted))]">
              Usuario: <b>{tempPassUser}</b>
            </div>
            <div className="mt-3 break-all rounded-2xl border border-[rgb(var(--border))] bg-black px-4 py-3 text-[16px] font-extrabold tracking-wide text-white">
              {tempPass}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button onClick={copyPassword}>Copiar</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setTempPass(null);
                  setTempPassUser(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </Card>
        )}

        {error && (
          <div className="text-[13px] font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-3">
          {companions.map((c) => (
            <Card key={c.id}>
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: drafts[c.id]?.color ?? c.color ?? "#999999" }}
                    />
                    <div className="text-[15px] font-extrabold">{c.username}</div>
                    {!c.active && (
                      <div className="rounded-full bg-red-50 px-2 py-1 text-[12px] font-bold text-red-600">
                        Inactivo
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Nombre</Label>
                      <div className="mt-1">
                        <Input
                          value={drafts[c.id]?.name ?? ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [c.id]: {
                                ...prev[c.id],
                                name: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Color</Label>
                      <input
                        type="color"
                        value={drafts[c.id]?.color ?? "#999999"}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [c.id]: {
                              ...prev[c.id],
                              color: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row md:flex-col md:items-stretch">
                  <Button
                    variant="ghost"
                    onClick={() => resetPassword(c.id, c.username)}
                    disabled={loadingResetId === c.id}
                  >
                    {loadingResetId === c.id ? "Generando…" : "Reset pass"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => toggleActive(c)}
                    disabled={toggleActiveId === c.id}
                  >
                    {toggleActiveId === c.id
                      ? "Actualizando…"
                      : c.active
                      ? "Desactivar"
                      : "Activar"}
                  </Button>

                  <Button
                    onClick={() => saveCompanion(c.id)}
                    disabled={savingId === c.id}
                  >
                    {savingId === c.id ? "Guardando…" : "Guardar"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {!companions.length && (
            <div className="text-[14px] text-[rgb(var(--muted))]">
              No hay acompañantes todavía.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}