import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/permissions";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const me = await requireUser();
  const { id } = await ctx.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      companion: {
        select: { id: true, name: true, color: true },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (me.role !== "admin" && event.companionId !== me.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const me = await requireUser();
  const { id } = await ctx.params;

  const existing = await prisma.event.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const raw = await req.text();
  let body: any = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (me.role === "admin") {
    const data: any = {};

    if (body.datetimeStart !== undefined) data.datetimeStart = new Date(body.datetimeStart);
    if (body.place !== undefined) data.place = body.place;
    if (body.price !== undefined) data.price = body.price;
    if (body.currency !== undefined) data.currency = body.currency;

    if (body.contactName !== undefined) data.contactName = body.contactName;
    if (body.contactPhone !== undefined) data.contactPhone = body.contactPhone;
    if (body.contactExtra !== undefined) data.contactExtra = body.contactExtra;

    if (body.companionId !== undefined) data.companionId = body.companionId;
    if (body.bringEquipment !== undefined) data.bringEquipment = body.bringEquipment;

    if (body.status !== undefined) {
      const allowed = ["pending", "confirmed", "cancelled", "done"];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
    }

    if (body.paid !== undefined) data.paid = body.paid;
    if (body.notesAdmin !== undefined) data.notesAdmin = body.notesAdmin;
    if (body.notesCompanion !== undefined) data.notesCompanion = body.notesCompanion;

    const updated = await prisma.event.update({
      where: { id },
      data,
      include: {
        companion: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json({ event: updated });
  }

  if (existing.companionId !== me.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const allowedCompanionData: any = {};
  if (body.notesCompanion !== undefined) {
    allowedCompanionData.notesCompanion = body.notesCompanion;
  }

  const updated = await prisma.event.update({
    where: { id },
    data: allowedCompanionData,
    include: {
      companion: {
        select: { id: true, name: true, color: true },
      },
    },
  });

  return NextResponse.json({ event: updated });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const me = await requireUser();
  if (me.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}