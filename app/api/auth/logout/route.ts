import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getJwtCookieName, verifyJwt } from "@/lib/auth-jwt";

/**
 * GET handler for logout - redirects to login after clearing session
 * This route is used by navigation redirects (e.g., router.push("/api/auth/logout"))
 */
export async function GET(req: NextRequest) {
  // Get the origin from the request to build the redirect URL
  const origin = req.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/login", origin));
  
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
          const ip = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
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
  
  // Delete the session token
  response.cookies.delete(getJwtCookieName());
  
  return response;
}

