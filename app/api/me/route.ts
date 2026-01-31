import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

export async function GET(req: Request) {
  console.log("Debug /api/me headers:", Object.fromEntries(req.headers));
  // log cookies safely?
  const user = await getCurrentUser();
  console.log("Debug /api/me user found:", !!user);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
