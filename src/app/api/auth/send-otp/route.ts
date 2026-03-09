import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail, generateOtp } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or prepare user reference
    let user = await prisma.user.findUnique({ where: { email } });

    await prisma.otp.create({
      data: {
        email,
        code,
        expiresAt,
        userId: user?.id,
      },
    });

    await sendOtpEmail(email, code);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Send OTP error:", err);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
