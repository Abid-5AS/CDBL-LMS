import { NextResponse } from "next/server";
import { getJwtCookieName } from "@/lib/auth-jwt";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("auth_user_email");
  res.cookies.delete("auth_user_name");
  res.cookies.delete("auth_user_role");
  res.cookies.delete("auth_user");
  res.cookies.delete(getJwtCookieName());
  return res;
}
