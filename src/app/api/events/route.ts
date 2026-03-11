import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/permissions";
import { z } from "zod";

const createSchema = z.object({
  datetimeStart: z.string().datetime(), // ISO string
  place: z.string().min(2),
  price: z.number().nonnegative().nullable().optional(),
  companionPrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(3).default("EUR"),

  contactName: z.string().optional(),
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

export async function GET(req: Request) {
  const me = await requireUser();
  const url = new URL(req.url);

  const from = url.searchParams.get("from"); // ISO
  const to = url.searchParams.get("to"); // ISO
  const status = url.searchParams.get("status");
  const paid = parseBool(url.searchParams.get("paid"));
  const companionId = url.searchParams.get("companionId"); // solo admin

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
    // acompañante: forzado a ver solo lo suyo
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

  const normalizedEvents = events.map(({ companions, ...event }) => ({
    ...event,
    companions: companions.map((item) => item.companion),
  }));

  const safeEvents =
    me.role === "admin"
      ? normalizedEvents
      : normalizedEvents.map((event) => ({ ...event, price: null }));

  return NextResponse.json({ events: safeEvents });
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
        create: companionIds.map((companionId) => ({ companionId })),
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
      event: {
        ...event,
        companions: event.companions.map((item) => item.companion),
      },
    },
    { status: 201 },
  );
}
