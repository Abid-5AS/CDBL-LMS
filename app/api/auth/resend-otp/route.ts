import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOtpCode } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

export const cache = "no-store";

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      // Don't reveal whether user exists for security
      return NextResponse.json(
        { error: "If this email exists, a new code has been sent" },
        { status: 200 }
      );
    }

    // Generate and send new OTP code
    try {
      const { code } = await createOtpCode(user.id, user.email, ip);

      // Send OTP via email
      const emailSent = await sendOtpEmail(user.email, code, user.name);

      if (!emailSent) {
        return NextResponse.json(
          { error: "Failed to send verification code. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "New verification code sent",
        expiresIn: 600, // 10 minutes
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
