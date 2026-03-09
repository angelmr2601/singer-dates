import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await ctx.params;

  const raw = await req.text();
  let body: any = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "Nombre demasiado corto" }, { status: 400 });
    }
    data.name = name;
  }

  if (body.color !== undefined) {
    const color = String(body.color).trim();
    const isHex = /^#([0-9a-fA-F]{6})$/.test(color);
    if (!isHex) {
      return NextResponse.json({ error: "Color inválido" }, { status: 400 });
    }
    data.color = color;
  }

  if (body.active !== undefined) {
    data.active = Boolean(body.active);
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!existing || existing.role !== "companion") {
    return NextResponse.json({ error: "Acompañante no encontrado" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      username: true,
      color: true,
      active: true,
    },
  });

  return NextResponse.json({ companion: updated });
}