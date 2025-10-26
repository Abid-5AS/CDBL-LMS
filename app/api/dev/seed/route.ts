export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/user";

export async function POST() {
  await dbConnect();
  const seed = [
    { name: "Employee One", email: "employee1@demo.local", role: "EMPLOYEE" },
    { name: "Employee Two", email: "employee2@demo.local", role: "EMPLOYEE" },
    { name: "HR Admin", email: "hr@demo.local", role: "HR_ADMIN" },
  ];
  for (const u of seed) {
    await User.updateOne({ email: u.email }, { $setOnInsert: u }, { upsert: true });
  }
  const all = await User.find().lean();
  return NextResponse.json({ ok: true, count: all.length });
}
