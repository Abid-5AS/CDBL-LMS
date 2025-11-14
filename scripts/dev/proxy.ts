import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { attachTraceId } from "@/lib/trace";

// Security: JWT_SECRET must be provided in environment
const SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
if (!SECRET) {
  throw new Error(
    "CRITICAL: JWT_SECRET or AUTH_SECRET must be set in environment variables. " +
    "Never use hardcoded secrets in production."
  );
}
const SECRET_KEY = new TextEncoder().encode(SECRET);

export async function proxy(req: NextRequest) {
  // Attach trace ID to request for error tracking (Next.js proxy pattern)
  attachTraceId(req);
  
  const token = req.cookies.get("session_token")?.value;
  const { pathname } = req.nextUrl;

  // 🔓 Public paths
  const publicPaths = ["/login", "/api/login", "/api/logout", "/api/auth/logout", "/api/notifications/latest"];
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  )
    return NextResponse.next();

  // Redirect root to dashboard
  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 🔐 Require token
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });
    const role = payload.role as string;

    // 🧭 Role hierarchy - updated to new dashboard routes
    const rolePathMap: Record<string, string[]> = {
      EMPLOYEE: ["/dashboard/employee"],
      DEPT_HEAD: ["/dashboard/dept-head"],
      HR_ADMIN: ["/dashboard/hr-admin"],
      HR_HEAD: ["/dashboard/hr-head"],
      CEO: ["/dashboard/ceo"],
      SYSTEM_ADMIN: ["/dashboard/admin"],
    };

    // 🧱 RBAC checks for dashboard routes
    if (pathname.startsWith("/dashboard/employee") && role !== "EMPLOYEE")
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/dashboard/hr-admin") && role !== "HR_ADMIN")
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/dashboard/dept-head") && !["DEPT_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/dashboard/hr-head") && !["HR_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/dashboard/ceo") && role !== "CEO")
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/dashboard/admin") && role !== "SYSTEM_ADMIN")
      return NextResponse.redirect(new URL("/dashboard", req.url));

    // 🧱 RBAC checks for legacy routes (redirect to new routes)
    // /admin routes: HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN can access
    if (pathname.startsWith("/admin") && !["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/ceo") && role !== "CEO")
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/hr-head") && !["HR_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/manager") && !["DEPT_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    // Employees page: HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD only
    if (pathname.startsWith("/employees") && !["HR_ADMIN", "HR_HEAD", "CEO", "DEPT_HEAD"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    // Approvals page: DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO only
    if (pathname.startsWith("/approvals") && !["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    // Reports page: HR_ADMIN, HR_HEAD, CEO only
    if (pathname.startsWith("/reports") && !["HR_ADMIN", "HR_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    // Policies page: All authenticated users can view policies
    if (pathname.startsWith("/policies") && !["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    // ✅ Security + caching headers
    const res = NextResponse.next();
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    if (process.env.NODE_ENV === "development") console.error("JWT verify failed:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

