import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { hasMustChangePasswordColumn } from "@/lib/db-compat";

const createSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  password: z.string().min(8).optional(),
  generateTempPassword: z.boolean().optional(),
});

function randomTempPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET() {
  await requireAdmin();

  const companions = await prisma.user.findMany({
    where: { role: "companion" },
    select: { id: true, name: true, username: true, color: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ companions });
}

export async function POST(req: Request) {
  await requireAdmin();

  const raw = await req.text();
  let body: unknown = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", raw }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues, raw },
      { status: 400 }
    );
  }

  const { name, username, color, password, generateTempPassword } = parsed.data;

  const temp = generateTempPassword ? randomTempPassword(12) : undefined;
  const finalPassword = password ?? temp;
  if (!finalPassword) {
    return NextResponse.json({ error: "Password required or generateTempPassword=true" }, { status: 400 });
  }

  try {
    const canWriteMustChangePassword = await hasMustChangePasswordColumn();

    const user = await prisma.user.create({
      data: {
        role: "companion",
        name,
        username,
        color,
        passwordHash: await hashPassword(finalPassword),
        active: true,
        ...(canWriteMustChangePassword ? { mustChangePassword: Boolean(temp) } : {}),
      },
      select: { id: true, name: true, username: true, color: true, active: true },
    });

    return NextResponse.json({ user, tempPassword: temp ?? null }, { status: 201 });
  } catch (e: any) {
    if (String(e?.code) === "P2002") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}