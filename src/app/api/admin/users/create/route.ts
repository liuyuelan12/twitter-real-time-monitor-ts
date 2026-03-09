import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, trialHours, subscriptionDays, password } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const now = new Date();
  const hours = Number(trialHours);
  const safeHours = isNaN(hours) || hours <= 0 ? 3 : hours;
  const trialExpiresAt = new Date(now.getTime() + safeHours * 60 * 60 * 1000);

  const data: Record<string, unknown> = {
    email,
    trialExpiresAt,
  };

  if (password) {
    data.passwordHash = hashPassword(password);
  }

  const subDays = Number(subscriptionDays);
  if (subDays > 0) {
    data.subscriptionActive = true;
    data.subscriptionExpiresAt = new Date(now.getTime() + subDays * 24 * 60 * 60 * 1000);
  }

  const user = await prisma.user.create({ data: data as any });
  return NextResponse.json({ user });
}
