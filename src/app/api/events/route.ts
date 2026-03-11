import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/permissions";
import { z } from "zod";

const createSchema = z.object({
  datetimeStart: z.string().datetime(),
  place: z.string().min(2),
  price: z.number().nonnegative(),
  companionPrice: z.number().nonnegative().nullable().optional(),
  companionPricing: z
    .array(
      z.object({
        companionId: z.string().uuid(),
        price: z.number().nonnegative().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
  currency: z.string().min(3).max(3).default("EUR"),

  contactName: z.string().min(2),
  contactPhone: z.string().optional(),
  contactExtra: z.string().optional(),

  companionIds: z.array(z.string().uuid()).optional().default([]),
  bringEquipment: z.boolean().default(false),

  status: z.enum(["pending", "confirmed", "cancelled", "done"]).default("pending"),
  paid: z.boolean().default(false),

  notesAdmin: z.string().optional(),
});

function parseBool(v: string | null) {
  if (v === null) return null;
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

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

export async function GET(req: Request) {
  const me = await requireUser();
  const url = new URL(req.url);

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = url.searchParams.get("status");
  const paid = parseBool(url.searchParams.get("paid"));
  const companionId = url.searchParams.get("companionId");

  const where: any = {};

  if (from || to) {
    where.datetimeStart = {};
    if (from) where.datetimeStart.gte = new Date(from);
    if (to) where.datetimeStart.lte = new Date(to);
  }
  if (status) where.status = status;
  if (paid !== null) where.paid = paid;

  if (me.role === "admin") {
    if (companionId) where.companions = { some: { companionId } };
  } else {
    where.companions = { some: { companionId: me.id } };
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { datetimeStart: "asc" },
    include: {
      companions: {
        include: {
          companion: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  return NextResponse.json({ events: events.map((event) => normalizeEvent(event, me)) });
}

export async function POST(req: Request) {
  const me = await requireUser();
  if (me.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const raw = await req.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", raw }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues, raw }, { status: 400 });
  }

  const data = parsed.data;
  const companionIds = [...new Set(data.companionIds)];

  if (companionIds.length > 0) {
    const validCompanions = await prisma.user.findMany({
      where: { id: { in: companionIds }, role: "companion", active: true },
      select: { id: true },
    });

    if (validCompanions.length !== companionIds.length) {
      return NextResponse.json({ error: "Invalid companionIds" }, { status: 400 });
    }
  }

  const pricingMap = new Map(
    data.companionPricing
      .filter((item) => companionIds.includes(item.companionId))
      .map((item) => [item.companionId, item.price ?? data.companionPrice ?? null]),
  );

  const event = await prisma.event.create({
    data: {
      datetimeStart: new Date(data.datetimeStart),
      place: data.place,
      price: data.price,
      currency: data.currency,
      companionPrice: data.companionPrice ?? null,

      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactExtra: data.contactExtra,

      companions: {
        create: companionIds.map((companionId) => ({
          companionId,
          companionPrice: pricingMap.get(companionId) ?? data.companionPrice ?? null,
        })),
      },
      bringEquipment: data.bringEquipment,

      status: data.status,
      paid: data.paid,

      notesAdmin: data.notesAdmin,
      createdById: me.id,
    },
    include: {
      companions: {
        include: {
          companion: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  return NextResponse.json(
    {
      event: normalizeEvent(event, me),
    },
    { status: 201 },
  );
}
