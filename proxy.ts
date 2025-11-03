import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { attachTraceId } from "@/lib/trace";

const SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-secret";
const SECRET_KEY = new TextEncoder().encode(SECRET);

export async function proxy(req: NextRequest) {
  // Attach trace ID to request for error tracking (Next.js 16 proxy pattern)
  attachTraceId(req);
  
  const token = req.cookies.get("session_token")?.value;
  const { pathname } = req.nextUrl;

  // 🔓 Public paths
  const publicPaths = ["/login", "/api/login", "/api/logout", "/api/notifications/latest"];
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

    // 🧭 Role hierarchy
    const rolePathMap: Record<string, string[]> = {
      EMPLOYEE: ["/dashboard"],
      DEPT_HEAD: ["/manager"],
      HR_ADMIN: ["/admin"],
      HR_HEAD: ["/hr-head"],
      CEO: ["/ceo", "/admin"],
    };

    // 🧱 RBAC checks
    if (pathname.startsWith("/admin") && !["HR_ADMIN", "HR_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    if (pathname.startsWith("/ceo") && role !== "CEO")
      return NextResponse.redirect(new URL(rolePathMap[role]?.[0] || "/dashboard", req.url));

    if (pathname.startsWith("/hr-head") && !["HR_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL(rolePathMap[role]?.[0] || "/dashboard", req.url));

    if (pathname.startsWith("/manager") && !["DEPT_HEAD", "CEO"].includes(role))
      return NextResponse.redirect(new URL(rolePathMap[role]?.[0] || "/dashboard", req.url));

    // Employees page: HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD only
    if (pathname.startsWith("/employees") && !["HR_ADMIN", "HR_HEAD", "CEO", "DEPT_HEAD"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));

    // Approvals page: DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO only
    if (pathname.startsWith("/approvals") && !["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"].includes(role))
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

