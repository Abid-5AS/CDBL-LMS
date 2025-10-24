import { NextResponse, NextRequest } from "next/server";
import { AUTH_COOKIE, verifyAuthJWT } from "@/lib/auth-jwt";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const url = req.nextUrl.clone();

  if (!token) {
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  try {
    await verifyAuthJWT(token);
  } catch {
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/leaves/:path*", "/api/leaves/:path*"],
};
