import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    include: { monitors: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, action, days } = await request.json();

  if (!userId || !action) {
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();

  switch (action) {
    case "activate_subscription": {
      const expiry = new Date(now.getTime() + (days || 30) * 24 * 60 * 60 * 1000);
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionActive: true,
          subscriptionExpiresAt: expiry,
        },
      });
      return NextResponse.json({ user: updated });
    }

    case "deactivate_subscription": {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionActive: false,
          subscriptionExpiresAt: null,
        },
      });
      return NextResponse.json({ user: updated });
    }

    case "extend_trial": {
      const baseDate = user.trialExpiresAt > now ? user.trialExpiresAt : now;
      const newExpiry = new Date(baseDate.getTime() + (days || 1) * 24 * 60 * 60 * 1000);
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { trialExpiresAt: newExpiry },
      });
      return NextResponse.json({ user: updated });
    }

    case "extend_subscription": {
      if (!user.subscriptionActive || !user.subscriptionExpiresAt) {
        return NextResponse.json({ error: "No active subscription to extend" }, { status: 400 });
      }
      const baseDate = user.subscriptionExpiresAt > now ? user.subscriptionExpiresAt : now;
      const newExpiry = new Date(baseDate.getTime() + (days || 30) * 24 * 60 * 60 * 1000);
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { subscriptionExpiresAt: newExpiry },
      });
      return NextResponse.json({ user: updated });
    }

    case "delete": {
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
