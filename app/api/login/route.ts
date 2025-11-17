import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rateLimit";
import { createOtpCode } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export const cache = "no-store";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 86400, // 1 day
};

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, skipOtp } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user has a password set
    if (!user.password) {
      return NextResponse.json(
        { error: "Account not properly configured. Please contact HR." },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if OTP should be skipped (testing mode)
    if (skipOtp === true) {
      // Direct login without OTP - create session cookies immediately
      const res = NextResponse.json({
        ok: true,
        requiresOtp: false,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });

      // Set authentication cookies
      res.cookies.set(
        "session_token",
        `session_${user.id}_${Date.now()}`,
        COOKIE_OPTIONS
      );
      res.cookies.set("auth_user_email", user.email, COOKIE_OPTIONS);
      res.cookies.set("auth_user_name", user.name, COOKIE_OPTIONS);

      return res;
    }

    // Generate and send OTP code
    try {
      const { code, expiresAt } = await createOtpCode(user.id, user.email, ip);

      // Send OTP via email
      const emailSent = await sendOtpEmail(user.email, code, user.name);

      if (!emailSent) {
        return NextResponse.json(
          { error: "Failed to send verification code. Please try again." },
          { status: 500 }
        );
      }

      // Return success with userId (but NOT the code - that's sent via email)
      return NextResponse.json({
        ok: true,
        requiresOtp: true,
        userId: user.id,
        email: user.email,
        expiresIn: 600, // 10 minutes in seconds
      });
    } catch (error) {
      console.error("OTP generation error:", error);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
