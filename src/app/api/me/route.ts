import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ user: null }, { status: 200 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      username: true,
      name: true,
      color: true,
      active: true,
      mustChangePassword: true,
    },
  });

  if (!me || !me.active) {
    session.destroy();
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: me }, { status: 200 });
}