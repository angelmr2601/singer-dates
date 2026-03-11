"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

export default function ChangePasswordForm({ forcePassword = false }: { forcePassword?: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (newPassword.length < 8) return setErr("Mínimo 8 caracteres.");
    if (newPassword !== confirmPassword) return setErr("La confirmación no coincide.");

    setSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "No se pudo cambiar la contraseña");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMsg("Contraseña cambiada ✅");

    if (forcePassword) {
      router.replace("/companion/agenda");
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="text-[15px] font-extrabold">{forcePassword ? "Crea tu nueva contraseña" : "Cambiar contraseña"}</div>

        <div>
          <Label>Contraseña actual</Label>
          <div className="mt-1">
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Nueva contraseña</Label>
          <div className="mt-1">
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Confirmar nueva contraseña</Label>
          <div className="mt-1">
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>

        {err && <div className="text-[13px] font-semibold text-red-600">{err}</div>}
        {msg && <div className="text-[13px] font-semibold text-green-600">{msg}</div>}

        <Button disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
      </form>
    </Card>
  );
}