export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, signAuthJWT } from "@/lib/auth-jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const emailInput = typeof body.email === "string" ? body.email.trim() : "";

    if (!emailInput) {
      return NextResponse.json({ error: "email_required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: emailInput,
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "unknown_user" }, { status: 401 });
    }

    const token = await signAuthJWT({ uid: String(user.id), role: user.role });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_user_id", String(user.id), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    res.cookies.set("auth_user_email", user.email ?? "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    res.cookies.set("auth_user_name", user.name ?? "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    res.cookies.set(AUTH_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.cookies.delete("auth_user");
    res.cookies.delete("auth_user_email_legacy");

    return res;
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
