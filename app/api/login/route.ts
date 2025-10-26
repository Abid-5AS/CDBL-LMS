export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt, getJwtCookieName } from "@/lib/auth-jwt";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const emailInput = typeof body.email === "string" ? body.email.trim() : "";
    const nameInput = typeof body.name === "string" ? body.name.trim() : "";

    if (!emailInput && !nameInput) {
      return NextResponse.json({ error: "credentials_required" }, { status: 400 });
    }

    const filters = [];
    if (emailInput) filters.push({ email: { equals: emailInput } });
    if (nameInput) filters.push({ name: { equals: nameInput } });

    const user = await prisma.user.findFirst({
      where: { OR: filters },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "unknown_user" }, { status: 401 });
    }

    const jwt = await signJwt({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set("auth_user_email", user.email ?? "", {
      ...COOKIE_OPTIONS,
      httpOnly: false,
    });
    res.cookies.set("auth_user_name", user.name ?? "", {
      ...COOKIE_OPTIONS,
      httpOnly: false,
    });
    res.cookies.set("auth_user_role", user.role ?? "", {
      ...COOKIE_OPTIONS,
      httpOnly: false,
    });
    res.cookies.set(getJwtCookieName(), jwt, {
      ...COOKIE_OPTIONS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.cookies.delete("auth_user_id");
    res.cookies.delete("auth_user");
    res.cookies.delete("auth_user_email_legacy");

    return res;
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
