import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt, getJwtCookieName } from "@/lib/auth-jwt";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rateLimit";

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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
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
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create JWT
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
            ip: ip,
            role: user.role,
          },
        },
      });
    } catch (auditError) {
      // Don't fail login if audit logging fails
      console.error("Failed to log audit trail:", auditError);
    }

    // Return success response with user data (without password)
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    // Set session token cookie
    res.cookies.set(getJwtCookieName(), jwt, {
      ...COOKIE_OPTIONS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
