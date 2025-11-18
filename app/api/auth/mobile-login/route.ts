import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rateLimit";
import { signJwt } from "@/lib/auth-jwt";
import { createOtpCode } from "@/lib/otp";

export const cache = "no-store";

/**
 * Mobile Login Endpoint
 *
 * Supports both OTP and direct login flows for mobile apps
 * Returns JWT tokens instead of session cookies
 */
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
    const { email, password, skipOtp = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        empCode: true,
        department: true,
      },
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

    // Check if OTP should be skipped (for mobile direct login or testing)
    if (skipOtp === true) {
      // Direct login without OTP - generate JWT token immediately
      const token = await signJwt({
        sub: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: String(user.id),
            email: user.email,
            name: user.name,
            employeeId: user.empCode || "",
            department: user.department || "",
            role: user.role,
          },
          token,
          refreshToken: token, // For now, use same token for refresh
          expiresIn: 8 * 60 * 60, // 8 hours in seconds
        },
      });
    }

    // Generate and prepare OTP code
    try {
      const { code, expiresAt } = await createOtpCode(user.id, user.email, ip);

      // For mobile, we return the flow information but NOT the code
      // (In production, OTP would be sent via email/SMS)
      return NextResponse.json({
        success: true,
        data: {
          requiresOtp: true,
          userId: String(user.id),
          email: user.email,
          expiresIn: 600, // 10 minutes in seconds
          message: "Verification code sent to your email",
        },
      });
    } catch (error) {
      console.error("OTP generation error:", error);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Mobile login error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
