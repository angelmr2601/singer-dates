import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { hasMustChangePasswordColumn } from "@/lib/db-compat";

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ user: null }, { status: 200 });

  const canReadMustChangePassword = await hasMustChangePasswordColumn();

  const me = canReadMustChangePassword
    ? await prisma.user.findUnique({
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
      })
    : await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          role: true,
          username: true,
          name: true,
          color: true,
          active: true,
        },
      });

  if (!me || !me.active) {
    session.destroy();
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      ...me,
      mustChangePassword: "mustChangePassword" in me ? me.mustChangePassword : false,
    },
  }, { status: 200 });
}