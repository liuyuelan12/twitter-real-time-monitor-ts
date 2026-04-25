import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseTopicId } from "@/lib/topicId";

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

  const { twitterUsername, telegramTopicId } = await request.json();

  if (!twitterUsername || typeof twitterUsername !== "string") {
    return NextResponse.json({ error: "Twitter username required" }, { status: 400 });
  }

  const username = twitterUsername.replace(/^@/, "").trim();

  const topicId = parseTopicId(telegramTopicId);
  if (topicId === "invalid") {
    return NextResponse.json({ error: "Invalid Telegram topic id" }, { status: 400 });
  }

  // Check limit (max 30 monitors per user)
  const count = await prisma.monitor.count({ where: { userId: session.userId } });
  if (count >= 30) {
    return NextResponse.json({ error: "Maximum 30 monitors allowed" }, { status: 400 });
  }

  try {
    const monitor = await prisma.monitor.create({
      data: {
        userId: session.userId,
        twitterUsername: username,
        telegramTopicId: topicId,
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
