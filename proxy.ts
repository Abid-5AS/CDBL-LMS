import { NextResponse, type NextRequest } from "next/server";
import { getJwtCookieName, verifyJwt } from "@/lib/auth-jwt";

function needsAuth(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/leaves") || pathname.startsWith("/approvals");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const email = req.cookies.get("auth_user_email")?.value;
  const role = req.cookies.get("auth_user_role")?.value;
  const jwt = req.cookies.get(getJwtCookieName())?.value;

  if (needsAuth(pathname)) {
    if (!email || !jwt) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    try {
      await verifyJwt(jwt);
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/approvals") && role !== "HR_ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/leaves/:path*", "/approvals/:path*"],
};
