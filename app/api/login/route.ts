export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/user";
import { signAuthJWT, AUTH_COOKIE } from "@/lib/auth-jwt";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await dbConnect();
    const u = await User.findById(userId).lean();
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const token = await signAuthJWT({ uid: String(u._id), role: String(u.role) });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid login request" }, { status: 400 });
  }
}
