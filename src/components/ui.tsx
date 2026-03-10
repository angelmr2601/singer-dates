import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  className?: string;
}) {
  const base =
    "rounded-2xl px-4 py-2 text-[14px] font-extrabold transition active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-black/90"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-transparent text-[rgb(var(--text))] hover:bg-black/5";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-black/10 ${className}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="text-[12px] font-bold text-[rgb(var(--muted))]">{children}</div>;
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full border border-[rgb(var(--border))] bg-black/5 px-2 py-1 text-[12px] font-semibold text-[rgb(var(--text))] ${className}`}
    >
      {children}
    </span>
  );
}
