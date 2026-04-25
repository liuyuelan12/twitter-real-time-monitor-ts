import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseTopicId } from "@/lib/topicId";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const monitor = await prisma.monitor.findFirst({
    where: { id, userId: session.userId },
  });

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.enabled !== undefined) {
    updateData.enabled = body.enabled;
  }

  if (body.telegramTopicId !== undefined) {
    const parsed = parseTopicId(body.telegramTopicId);
    if (parsed === "invalid") {
      return NextResponse.json({ error: "Invalid Telegram topic id" }, { status: 400 });
    }
    updateData.telegramTopicId = parsed;
  }

  const updated = await prisma.monitor.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const monitor = await prisma.monitor.findFirst({
    where: { id, userId: session.userId },
  });

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  await prisma.monitor.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
