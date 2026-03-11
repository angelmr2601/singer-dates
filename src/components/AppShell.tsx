"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function AppShell({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-extrabold tracking-tight sm:text-[18px]">
              {title}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {right}
            <Button variant="ghost" onClick={onLogout} disabled={loggingOut}>
              {loggingOut ? "Saliendo…" : "Salir"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 pb-28 pt-4 sm:px-4">
        {children}
      </main>
    </div>
  );
}
