"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();

        if (cancelled) return;

        if (!data?.user) {
          router.replace("/login");
          return;
        }

        if (data.user.role === "admin") router.replace("/admin/agenda");
        else router.replace("/companion/agenda");
      } catch {
        // si algo falla, manda a login
        if (!cancelled) router.replace("/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main style={{ padding: 16 }}>
      Cargando…
    </main>
  );
}