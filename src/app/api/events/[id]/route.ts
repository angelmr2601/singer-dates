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
  companionPricing: z
    .array(
      z.object({
        companionId: z.string().uuid(),
        price: z.number().nonnegative().nullable().optional(),
      }),
    )
    .optional(),
  currency: z.string().length(3).optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactExtra: z.string().nullable().optional(),
  companionIds: z.array(z.string().uuid()).optional(),
  bringEquipment: z.boolean().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "done"]).optional(),
  paid: z.boolean().optional(),
  notesAdmin: z.string().nullable().optional(),
  notesCompanion: z.string().nullable().optional(),
});

const companionPatchSchema = z.object({
  notesCompanion: z.string().nullable().optional(),
});

function normalizeEvent(event: any, me: { role: string; id: string }) {
  const companionAssignments = (event.companions ?? []).map((item: any) => ({
    ...item.companion,
    companionPrice: item.companionPrice,
  }));

  if (me.role === "admin") {
    return {
      ...event,
      companions: companionAssignments,
    };
  }

  const ownAssignment = companionAssignments.find((item: any) => item.id === me.id);

  return {
    ...event,
    price: null,
    companionPrice: ownAssignment?.companionPrice ?? null,
    companions: companionAssignments.map(({ companionPrice: _ignored, ...companion }: any) => companion),
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await ctx.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      companions: {
        include: {
          companion: {
            select: { id: true, name: true, color: true },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAssigned = event.companions.some((item) => item.companionId === me.id);
  if (me.role !== "admin" && !isAssigned) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ event: normalizeEvent(event, me) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await ctx.params;

  const existing = await prisma.event.findUnique({
    where: { id },
    include: { companions: true },
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

    const nextCompanionIds = parsed.data.companionIds
      ? [...new Set(parsed.data.companionIds)]
      : existing.companions.map((item) => item.companionId);

    if (parsed.data.companionIds && nextCompanionIds.length > 0) {
      const companions = await prisma.user.findMany({
        where: { id: { in: nextCompanionIds }, role: "companion", active: true },
        select: { id: true },
      });
      if (companions.length !== nextCompanionIds.length) {
        return NextResponse.json({ error: "Invalid companionIds" }, { status: 400 });
      }
    }

    const pricingMap = new Map(
      (parsed.data.companionPricing ?? [])
        .filter((item) => nextCompanionIds.includes(item.companionId))
        .map((item) => [item.companionId, item.price]),
    );

    const fallbackCompanionPrice =
      parsed.data.companionPrice !== undefined ? parsed.data.companionPrice : existing.companionPrice;
    const existingPrices = new Map(existing.companions.map((item) => [item.companionId, item.companionPrice]));

    let companionNestedUpdate: Prisma.EventUpdateInput["companions"] | undefined;
    if (parsed.data.companionIds !== undefined || parsed.data.companionPricing !== undefined) {
      companionNestedUpdate = {
        deleteMany: {},
        create: nextCompanionIds.map((companionId) => ({
          companionId,
          companionPrice: pricingMap.get(companionId) ?? existingPrices.get(companionId) ?? fallbackCompanionPrice ?? null,
        })),
      };
    }

    const { companionIds: _ignoredCompanionIds, companionPricing: _ignoredPricing, ...baseData } = parsed.data;
    const data: Prisma.EventUpdateInput = {
      ...baseData,
      ...(parsed.data.datetimeStart !== undefined
        ? { datetimeStart: new Date(parsed.data.datetimeStart) }
        : {}),
      ...(companionNestedUpdate ? { companions: companionNestedUpdate } : {}),
    };

    const updated = await prisma.event.update({
      where: { id },
      data,
      include: {
        companions: {
          include: {
            companion: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ event: normalizeEvent(updated, me) });
  }

  const isAssigned = existing.companions.some((item) => item.companionId === me.id);
  if (!isAssigned) {
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
      companions: {
        include: {
          companion: {
            select: { id: true, name: true, color: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ event: normalizeEvent(updated, me) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
