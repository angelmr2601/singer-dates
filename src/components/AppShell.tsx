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
      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="text-[17px] font-extrabold tracking-tight">{title}</div>
          <div className="flex items-center gap-2">{right}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}