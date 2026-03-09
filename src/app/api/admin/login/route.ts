import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
