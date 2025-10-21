export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/user";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  await dbConnect();

  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const items = await User.find(filter).sort({ name: 1 }).limit(20).lean();
  const mapped = items.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  return NextResponse.json({ items: mapped });
}
