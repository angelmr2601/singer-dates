import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/permissions";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hasMustChangePasswordColumn } from "@/lib/db-compat";

export async function POST(req: Request) {
  const me = await requireUser();

  const raw = await req.text();
  let body: any = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");
  const confirmPassword = String(body?.confirmPassword ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password too short (min 8)" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, passwordHash: true, active: true },
  });

  if (!user || !user.active) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

  const canWriteMustChangePassword = await hasMustChangePasswordColumn();

  await prisma.user.update({
    where: { id: user.id },
    data: canWriteMustChangePassword
      ? { passwordHash: await hashPassword(newPassword), mustChangePassword: false }
      : { passwordHash: await hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}