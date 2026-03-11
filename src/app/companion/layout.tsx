"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import TabBar from "@/components/TabBar";

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json();
      if (!data?.user) return router.replace("/login");
      if (data.user.role !== "companion") return router.replace("/admin/agenda");
      if (data.user.mustChangePassword && pathname !== "/companion/settings") {
        return router.replace("/companion/settings?forcePassword=1");
      }
    })();
  }, [pathname, router]);

  return (
    <div className="pb-24">
      {children}
      <TabBar
        tabs={[
          { href: "/companion/agenda", label: "Agenda" },
          { href: "/companion/calendar", label: "Calendario" },
          { href: "/companion/settings", label: "Ajustes" },
        ]}
      />
    </div>
  );
}