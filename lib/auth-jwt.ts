import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Prisma } from "@prisma/client";

const SECRET =
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-secret";

// Security: Ensure strong secret in production
if (process.env.NODE_ENV === "production" && (!SECRET || SECRET === "dev-secret" || SECRET.length < 32)) {
  throw new Error(
    "JWT_SECRET must be set to a strong secret (minimum 32 characters) in production environment. " +
    "Generate a secure secret using: openssl rand -base64 32"
  );
}

const JWT_COOKIE = "session_token";

const encoder = new TextEncoder();
const SECRET_KEY = encoder.encode(SECRET);

type JwtClaims = {
  sub: string;
  email?: string;
  name?: string;
  role?: "EMPLOYEE" | "DEPT_HEAD" | "HR_ADMIN" | "HR_HEAD" | "CEO" | "SYSTEM_ADMIN";
};

export async function signJwt(claims: JwtClaims, maxAgeSeconds = 60 * 60 * 8) {
  return new SignJWT(claims as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(SECRET_KEY);
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, SECRET_KEY, {
    algorithms: ["HS256"],
  });
  return payload as JwtClaims;
}

export const getCurrentUser = cache(async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(JWT_COOKIE)?.value;
  const emailCookie = store.get("auth_user_email")?.value;
  const nameCookie = store.get("auth_user_name")?.value;

  const where: Prisma.UserWhereInput = {};

  if (token) {
    try {
      const claims = await verifyJwt(token);
      if (claims.email) {
        where.email = claims.email;
      } else if (claims.sub) {
        const id = Number(claims.sub);
        if (!Number.isNaN(id)) where.id = id;
      }
    } catch {
      // invalid/expired token -> fall back to cookies
    }
  }

  if (!where.email && !where.id && emailCookie) {
    where.email = emailCookie;
  }
  if (!where.email && !where.id && nameCookie) {
    where.name = nameCookie;
  }

  if (!Object.keys(where).length) return null;
  return prisma.user.findFirst({ where });
});

export function getJwtCookieName() {
  return JWT_COOKIE;
}
