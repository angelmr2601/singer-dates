"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string };

export default function TabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgb(var(--border))] bg-white/95 backdrop-blur">
      <div
        className="mx-auto grid max-w-5xl gap-1 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={[
                "rounded-2xl px-2 py-3 text-center text-[11px] font-extrabold transition sm:text-[12px]",
                active ? "bg-black text-white" : "text-[rgb(var(--muted))] hover:bg-black/5",
              ].join(" ")}
            >
              <span className="block truncate">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}