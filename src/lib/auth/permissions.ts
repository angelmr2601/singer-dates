import { getSession } from "./session";

export async function requireUser() {
  const session = await getSession();
  if (!session.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function requireAdmin() {
  const me = await requireUser();
  if (me.role !== "admin") throw new Error("FORBIDDEN");
  return me;
}