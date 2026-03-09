import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/permissions";
import { z } from "zod";

const updateSchema = z.object({
  datetimeStart: z.string().datetime().optional(),
  place: z.string().min(2).optional(),
  price: z.number().nonnegative().optional().nullable(),
  currency: z.string().min(3).max(3).optional(),

  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactExtra: z.string().optional().nullable(),

  companionId: z.string().uuid().optional().nullable(),
  bringEquipment: z.boolean().optional(),

  status: z.enum(["pending", "confirmed", "cancelled", "done"]).optional(),
  paid: z.boolean().optional(),

  notesAdmin: z.string().optional().nullable(),
  // Si más adelante quieres que el companion pueda dejar notas:
  notesCompanion: z.string().optional().nullable(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await ctx.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { companion: { select: { id: true, name: true, color: true } } },
  });

  if (!event) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Permisos
  if (me.role !== "admin" && event.companionId !== me.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await ctx.params;

  const existing = await prisma.event.findUnique({ where: { id } });
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

  // Admin puede editar todo
  if (me.role === "admin") {
    const data: any = { ...parsed.data };

    if (data.datetimeStart) data.datetimeStart = new Date(data.datetimeStart);

    // si se cambia companionId, validar
    if (data.companionId !== undefined) {
      if (data.companionId === null) {
        // ok, desasignar
      } else {
        const c = await prisma.user.findUnique({
          where: { id: data.companionId },
          select: { id: true, role: true, active: true },
        });
        if (!c || c.role !== "companion" || !c.active) {
          return NextResponse.json({ error: "Invalid companionId" }, { status: 400 });
        }
      }
    }

    const updated = await prisma.event.update({
      where: { id },
      data,
      include: { companion: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json({ event: updated });
  }

  // Acompañante: solo puede ver/editar lo suyo (y solo notesCompanion si lo habilitas)
  if (existing.companionId !== me.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

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