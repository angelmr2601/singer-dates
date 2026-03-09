"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TabBar from "@/components/TabBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json();
      if (!data?.user) return router.replace("/login");
      if (data.user.role !== "admin") return router.replace("/companion/agenda");
    })();
  }, [router]);

  return (
    <div className="pb-24">
      {children}
      <TabBar
        tabs={[
          { href: "/admin/agenda", label: "Agenda" },
          { href: "/admin/calendar", label: "Calendario" },
          { href: "/admin/companions", label: "Acompañantes" },
          { href: "/admin/settings", label: "Ajustes" },
        ]}
      />
    </div>
  );
}