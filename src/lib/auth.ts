import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
const COOKIE_NAME = "session";
const ADMIN_COOKIE_NAME = "admin_session";

interface SessionPayload {
  userId: string;
  email: string;
}

interface AdminSessionPayload {
  role: "admin";
}

export async function createSession(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { monitors: true },
  });

  return user;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// --- Admin auth ---

export async function createAdminSession(): Promise<string> {
  const token = await new SignJWT({ role: "admin" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return token;
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if ((payload as any).role !== "admin") return null;
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export function isSubscriptionActive(user: {
  trialExpiresAt: Date;
  subscriptionActive: boolean;
  subscriptionExpiresAt: Date | null;
}): boolean {
  const now = new Date();

  // Trial still active
  if (now < user.trialExpiresAt) return true;

  // Paid subscription active
  if (user.subscriptionActive && user.subscriptionExpiresAt && now < user.subscriptionExpiresAt) {
    return true;
  }

  return false;
}
