import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth";
import { verifyOtpCode } from "@/lib/otp";

export const cache = "no-store";

/**
 * Mobile OTP Verification Endpoint
 *
 * Verifies OTP code sent during login and returns JWT token
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and verification code are required",
        },
        { status: 400 }
      );
    }

    // Get IP address for security tracking
    const ip = req.headers.get("x-forwarded-for") || "local";

    // Verify the OTP code
    const verification = await verifyOtpCode(email, code, ip);

    if (!verification.valid) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Invalid verification code",
        },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        empCode: true,
        department: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Create JWT token
    const token = await signJwt({
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
          action: "LOGIN_MOBILE",
          targetEmail: user.email,
          details: {
            ip,
            role: user.role,
            otp: true,
          },
        },
      });
    } catch (auditError) {
      // Don't fail login if audit logging fails
      console.error("Failed to log audit trail:", auditError);
    }

    // Return success response with user data and token
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
  } catch (error) {
    console.error("Mobile OTP verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
