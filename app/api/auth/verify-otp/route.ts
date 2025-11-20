import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt, getJwtCookieName } from "@/lib/auth";
import { verifyOtpCode } from "@/lib/otp";

export const cache = "no-store";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 86400, // 1 day
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Get IP address for security tracking
    const ip = req.headers.get("x-forwarded-for") || "local";

    // Verify the OTP code
    const verification = await verifyOtpCode(email, code, ip);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || "Invalid verification code" },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create JWT session
    const jwt = await signJwt({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Log successful login to audit trail
    try {
      await prisma.auditLog.create({
        data: {
          actorEmail: user.email,
          action: "LOGIN",
          targetEmail: user.email,
          details: {
            ip,
            role: user.role,
            twoFactor: true,
          },
        },
      });
    } catch (auditError) {
      // Don't fail login if audit logging fails
      console.error("Failed to log audit trail:", auditError);
    }

    // Return success response with user data
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set session token cookie
    res.cookies.set(getJwtCookieName(), jwt, {
      ...COOKIE_OPTIONS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
