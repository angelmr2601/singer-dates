"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string };

export default function TabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgb(var(--border))] bg-white/90 backdrop-blur">
      <div
        className="mx-auto grid max-w-5xl px-2 pb-[env(safe-area-inset-bottom)] pt-2"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={[
                "mx-1 rounded-2xl px-2 py-2 text-center text-[12px] font-extrabold transition",
                active ? "bg-black text-white" : "text-[rgb(var(--muted))] hover:bg-black/5",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}