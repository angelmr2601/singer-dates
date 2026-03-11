import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";

function randomTempPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await ctx.params;

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, active: true },
  });

  if (!existing || existing.role !== "companion") {
    return NextResponse.json({ error: "Acompañante no encontrado" }, { status: 404 });
  }

  const tempPassword = randomTempPassword(12);

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true,
    },
  });

  return NextResponse.json({
    ok: true,
    tempPassword,
  });
}