"use client";

import { useSearchParams } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function CompanionSettingsPage() {
  const searchParams = useSearchParams();
  const forcePassword = searchParams.get("forcePassword") === "1";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Ajustes</h1>
      {forcePassword && (
        <div style={{ marginTop: 12, color: "#b45309", fontWeight: 700 }}>
          Debes cambiar la contraseña temporal antes de continuar.
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <ChangePasswordForm forcePassword={forcePassword} />
      </div>
    </main>
  );
}