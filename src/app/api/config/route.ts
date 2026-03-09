import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botToken, chatIds } = await request.json();

  const updateData: Record<string, unknown> = {};
  if (botToken !== undefined) updateData.botToken = botToken || null;
  if (chatIds !== undefined) updateData.chatId = Array.isArray(chatIds) ? chatIds.join(",") : null;

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: updateData,
  });

  return NextResponse.json({
    botToken: user.botToken ? "***configured***" : null,
    chatIds: user.chatId ? user.chatId.split(",") : [],
  });
}
