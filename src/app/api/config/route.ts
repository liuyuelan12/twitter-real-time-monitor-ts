import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botToken, chatId } = await request.json();

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      botToken: botToken || null,
      chatId: chatId || null,
    },
  });

  return NextResponse.json({
    botToken: user.botToken ? "***configured***" : null,
    chatId: user.chatId,
  });
}
