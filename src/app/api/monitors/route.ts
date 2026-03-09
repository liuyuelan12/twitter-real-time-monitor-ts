import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monitors = await prisma.monitor.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(monitors);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { twitterUsername } = await request.json();

  if (!twitterUsername || typeof twitterUsername !== "string") {
    return NextResponse.json({ error: "Twitter username required" }, { status: 400 });
  }

  const username = twitterUsername.replace(/^@/, "").trim();

  // Check limit (max 10 monitors per user)
  const count = await prisma.monitor.count({ where: { userId: session.userId } });
  if (count >= 10) {
    return NextResponse.json({ error: "Maximum 10 monitors allowed" }, { status: 400 });
  }

  try {
    const monitor = await prisma.monitor.create({
      data: {
        userId: session.userId,
        twitterUsername: username,
      },
    });

    return NextResponse.json(monitor);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Already monitoring this account" }, { status: 400 });
    }
    throw err;
  }
}
