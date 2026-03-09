import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TelegramChat {
  id: number;
  title?: string;
  username?: string;
  type: string;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botToken } = await request.json();

  // Use provided token or saved token
  let token = botToken;
  if (!token) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    token = user?.botToken;
  }

  if (!token) {
    return NextResponse.json({ error: "Please enter your Bot Token first" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      method: "GET",
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: "Invalid Bot Token or Telegram API error" }, { status: 400 });
    }

    // Extract unique chats from updates
    const chatMap = new Map<number, TelegramChat>();

    for (const update of data.result ?? []) {
      const msg = update.message ?? update.channel_post ?? update.my_chat_member?.chat;
      if (!msg) continue;

      const chat = msg.chat ?? msg;
      if (!chat?.id) continue;

      // Only include groups and channels
      if (["group", "supergroup", "channel"].includes(chat.type)) {
        chatMap.set(chat.id, {
          id: chat.id,
          title: chat.title ?? `Chat ${chat.id}`,
          username: chat.username,
          type: chat.type,
        });
      }
    }

    const chats = Array.from(chatMap.values());

    return NextResponse.json({ chats });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to connect to Telegram API" }, { status: 500 });
  }
}
