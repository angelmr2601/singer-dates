import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, role: true, active: true, passwordHash: true, mustChangePassword: true },
    });
    if (!user || !user.active) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    if (!process.env.SESSION_PASSWORD) {
      console.error("Missing SESSION_PASSWORD environment variable");
      return NextResponse.json(
        { error: "Server auth is not configured correctly" },
        { status: 503 },
      );
    }

    const session = await getSession();
    session.user = { id: user.id, role: user.role };
    await session.save();

    return NextResponse.json({
      ok: true,
      role: user.role,
      mustChangePassword: user.role === "companion" ? user.mustChangePassword : false,
    });
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
