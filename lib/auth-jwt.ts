import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Prisma } from "@prisma/client";

const SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-secret";
const JWT_COOKIE = "jwt";

const encoder = new TextEncoder();
const SECRET_KEY = encoder.encode(SECRET);

type JwtClaims = {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
};

export async function signJwt(claims: JwtClaims, maxAgeSeconds = 60 * 60 * 8) {
  return new SignJWT(claims as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(SECRET_KEY);
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });
  return payload as JwtClaims;
}

export async function getCurrentUser() {
  const store = cookies();
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
}

export function getJwtCookieName() {
  return JWT_COOKIE;
}
