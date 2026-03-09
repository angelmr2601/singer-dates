"use client";

import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function CompanionSettingsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Ajustes</h1>
      <div style={{ marginTop: 16 }}>
        <ChangePasswordForm />
      </div>
    </main>
  );
}