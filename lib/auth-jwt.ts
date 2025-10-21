import { SignJWT, jwtVerify, JWTPayload } from "jose";

const secret = process.env.AUTH_SECRET!;
const cookieName = process.env.AUTH_COOKIE || "auth_token";
if (!secret) throw new Error("AUTH_SECRET missing");

const key = new TextEncoder().encode(secret);

export type AuthClaims = { uid: string; role: string };

export async function signAuthJWT(claims: AuthClaims, maxAgeSeconds = 60 * 60 * 8) {
  return await new SignJWT(claims as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(key);
}

export async function verifyAuthJWT(token: string) {
  const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
  return payload as unknown as AuthClaims;
}

export const AUTH_COOKIE = cookieName;
