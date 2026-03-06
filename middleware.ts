import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-secret";
const SECRET_KEY = new TextEncoder().encode(SECRET);

const TOKEN_MAX_AGE_S = 60 * 60 * 8; // 8 hours
const ROTATION_THRESHOLD_S = TOKEN_MAX_AGE_S / 2; // Rotate after 4 hours

const PUBLIC_PATHS = [
  "/login",
  "/api",
  "/_next",
  "/favicon.ico",
  "/terms",
  "/privacy",
  "/guidelines",
  "/help",
  "/sw.js",
  "/manifest.json",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session_token")?.value;
  const emailCookie = req.cookies.get("auth_user_email")?.value;

  if (!token && !emailCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });

      const response = NextResponse.next();

      // Rotate token if past half-life
      const iat = payload.iat as number | undefined;
      if (iat) {
        const ageSeconds = Math.floor(Date.now() / 1000) - iat;
        if (ageSeconds > ROTATION_THRESHOLD_S) {
          const { exp, iat: _iat, nbf, ...claims } = payload;
          const newToken = await new SignJWT(claims)
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime(`${TOKEN_MAX_AGE_S}s`)
            .sign(SECRET_KEY);

          response.cookies.set("session_token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: TOKEN_MAX_AGE_S,
          });
        }
      }

      return response;
    } catch {
      // JWT invalid — fall through to check emailCookie (skipOtp flow)
    }
  }

  // Fallback: session_token is a plain string (skipOtp) or only emailCookie exists
  if (emailCookie || (token && token.startsWith("session_"))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
