import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getJwtCookieName, verifyJwt } from "@/lib/auth-jwt";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });

  // Try to get user info from JWT for audit logging
  const store = await cookies();
  const token = store.get(getJwtCookieName())?.value;

  if (token) {
    try {
      const claims = await verifyJwt(token);
      const email = claims.email;

      if (email) {
        // Log logout event to audit trail
        try {
          const ip = req.headers.get("x-forwarded-for") || "local";
          await prisma.auditLog.create({
            data: {
              actorEmail: email,
              action: "LOGOUT",
              targetEmail: email,
              details: {
                ip: ip,
              },
            },
          });
        } catch (auditError) {
          // Don't fail logout if audit logging fails
          console.error("Failed to log audit trail:", auditError);
        }
      }
    } catch (error) {
      // Invalid or expired token, skip audit logging
      console.error("Failed to verify JWT during logout:", error);
    }
  }

  // Delete all auth-related cookies
  res.cookies.delete(getJwtCookieName());
  res.cookies.delete("auth_user_email");
  res.cookies.delete("auth_user_name");

  return res;
}
