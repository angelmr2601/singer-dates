"use client";

import type { ReactNode } from "react";

export default function AppShell({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-extrabold tracking-tight sm:text-[18px]">
              {title}
            </div>
          </div>

          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 pb-28 pt-4 sm:px-4">
        {children}
      </main>
    </div>
  );
}