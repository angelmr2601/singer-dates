import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/permissions";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const adminPatchSchema = z.object({
  datetimeStart: z.string().datetime().optional(),
  place: z.string().min(2).optional(),
  price: z.number().nonnegative().nullable().optional(),
  companionPrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactExtra: z.string().nullable().optional(),
  companionId: z.string().uuid().nullable().optional(),
  bringEquipment: z.boolean().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "done"]).optional(),
  paid: z.boolean().optional(),
  notesAdmin: z.string().nullable().optional(),
  notesCompanion: z.string().nullable().optional(),
});

const companionPatchSchema = z.object({
  notesCompanion: z.string().nullable().optional(),
});

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

  const safeEvent = me.role === "admin" ? event : { ...event, price: null };

  return NextResponse.json({ event: safeEvent });
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
  let body: unknown = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (me.role === "admin") {
    const parsed = adminPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
    }

    const data: Prisma.EventUpdateInput = {
      ...parsed.data,
      ...(parsed.data.datetimeStart !== undefined
        ? { datetimeStart: new Date(parsed.data.datetimeStart) }
        : {}),
    };

    if (parsed.data.companionId) {
      const companion = await prisma.user.findUnique({
        where: { id: parsed.data.companionId },
        select: { id: true, role: true, active: true },
      });
      if (!companion || companion.role !== "companion" || !companion.active) {
        return NextResponse.json({ error: "Invalid companionId" }, { status: 400 });
      }
    }

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

  const allowedCompanionData: Prisma.EventUpdateInput = {};
  const parsed = companionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  if (parsed.data.notesCompanion !== undefined) {
    allowedCompanionData.notesCompanion = parsed.data.notesCompanion;
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
