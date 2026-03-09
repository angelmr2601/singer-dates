"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "No se pudo iniciar sesión");
      return;
    }

    const data = await res.json().catch(() => null);
    router.replace(data?.role === "admin" ? "/admin/agenda" : "/companion/agenda");
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] px-4 pt-16">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <div className="text-[24px] font-extrabold tracking-tight">Singer Dates</div>
          <div className="mt-1 text-[14px] text-[rgb(var(--muted))]">Entra para ver tu agenda.</div>
        </div>

        <Card>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <Label>Usuario</Label>
              <div className="mt-1">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              </div>
            </div>

            <div>
              <Label>Contraseña</Label>
              <div className="mt-1">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {err && <div className="text-[13px] font-semibold text-red-600">{err}</div>}

            <Button disabled={loading} className="mt-2">
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}