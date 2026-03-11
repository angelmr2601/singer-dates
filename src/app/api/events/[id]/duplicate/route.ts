import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/permissions";
import { z } from "zod";

const updateSchema = z.object({
  datetimeStart: z.string().datetime().optional(),
  place: z.string().min(2).optional(),
  price: z.number().nonnegative().optional().nullable(),
  companionPrice: z.number().nonnegative().optional().nullable(),
  currency: z.string().min(3).max(3).optional(),

  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactExtra: z.string().optional().nullable(),

  companionIds: z.array(z.string().uuid()).optional(),
  bringEquipment: z.boolean().optional(),

  status: z.enum(["pending", "confirmed", "cancelled", "done"]).optional(),
  paid: z.boolean().optional(),

  notesAdmin: z.string().optional().nullable(),
  notesCompanion: z.string().optional().nullable(),
});

function normalizeEvent(event: any) {
  return {
    ...event,
    companions: event.companions.map((item: any) => item.companion),
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await ctx.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      companions: {
        include: { companion: { select: { id: true, name: true, color: true } } },
      },
    },
  });

  if (!event) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const isAssigned = event.companions.some((item) => item.companionId === me.id);
  if (me.role !== "admin" && !isAssigned) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ event: normalizeEvent(event) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await ctx.params;

  const existing = await prisma.event.findUnique({ where: { id }, include: { companions: true } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const raw = await req.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", raw }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues, raw }, { status: 400 });
  }

  if (me.role === "admin") {
    const data: any = { ...parsed.data };

    if (data.datetimeStart) data.datetimeStart = new Date(data.datetimeStart);

    if (data.companionIds !== undefined) {
      const companionIds = [...new Set(data.companionIds as string[])];
      if (companionIds.length > 0) {
        const companions = await prisma.user.findMany({
          where: { id: { in: companionIds }, role: "companion", active: true },
          select: { id: true },
        });
        if (companions.length !== companionIds.length) {
          return NextResponse.json({ error: "Invalid companionIds" }, { status: 400 });
        }
      }

      data.companions = {
        deleteMany: {},
        create: companionIds.map((companionId) => ({ companionId })),
      };
      delete data.companionIds;
    }

    const updated = await prisma.event.update({
      where: { id },
      data,
      include: {
        companions: {
          include: { companion: { select: { id: true, name: true, color: true } } },
        },
      },
    });

    return NextResponse.json({ event: normalizeEvent(updated) });
  }

  const isAssigned = existing.companions.some((item) => item.companionId === me.id);
  if (!isAssigned) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const allowed = { notesCompanion: parsed.data.notesCompanion } as any;
  const updated = await prisma.event.update({ where: { id }, data: allowed });

  return NextResponse.json({ event: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await ctx.params;

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
