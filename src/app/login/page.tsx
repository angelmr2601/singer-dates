"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canSubmit = username.trim().length > 0 && password.length > 0;

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
    if (data?.role === "admin") {
      router.replace("/admin/agenda");
      return;
    }

    router.replace(data?.mustChangePassword ? "/companion/settings?forcePassword=1" : "/companion/agenda");
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] px-4 pt-16">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <div className="text-[24px] font-extrabold tracking-tight">Singer Dates</div>
          <div className="mt-1 text-[14px] text-[rgb(var(--muted))]">
            Entra para ver tu agenda y próximos eventos.
          </div>
        </div>

        <Card>
          <form onSubmit={onSubmit} className="grid gap-3" noValidate>
            <div>
              <Label>Usuario</Label>
              <div className="mt-1">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Tu usuario"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Contraseña</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {err && <div className="text-[13px] font-semibold text-red-600">{err}</div>}

            <Button disabled={loading || !canSubmit} className="mt-2">
              {loading ? "Entrando…" : "Entrar"}
            </Button>

            <div className="text-[12px] text-[rgb(var(--muted))]">
              Consejo: puedes revisar la contraseña antes de enviar tocando “Mostrar”.
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
