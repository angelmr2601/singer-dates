import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  role: "admin" | "companion";
};

export type SessionData = {
  user?: SessionUser;
};

const sessionOptions: SessionOptions = {
  cookieName: "singer_dates_session",
  password: process.env.SESSION_PASSWORD!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}