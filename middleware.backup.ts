import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge-compatible JWT verification
const SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-secret";
const SECRET_KEY = new TextEncoder().encode(SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const { pathname } = req.nextUrl;

  // Allow access to login page and static assets
  if (pathname.startsWith("/login") || pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify JWT token properly
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });
    const role = payload.role as string;

    // Role-based route protection
    const rolePathMap: Record<string, string> = {
      EMPLOYEE: "/dashboard",
      DEPT_HEAD: "/manager",
      HR_ADMIN: "/admin",
      HR_HEAD: "/hr-head",
      CEO: "/ceo",
    };

    // Check if user is trying to access a role-specific route
    for (const [roleKey, basePath] of Object.entries(rolePathMap)) {
      if (pathname.startsWith(basePath)) {
        if (role !== roleKey) {
          // Redirect to user's authorized dashboard
          const redirectTo = rolePathMap[role] || "/dashboard";
          return NextResponse.redirect(new URL(redirectTo, req.url));
        }
      }
    }
  } catch (error) {
    // Invalid or expired token, redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

