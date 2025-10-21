export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/user";

export async function POST() {
  await dbConnect();
  const seed = [
    { name: "Employee One", email: "emp1@cdbl.test", role: "employee" },
    { name: "Dept Head", email: "depthead@cdbl.test", role: "dept_head" },
    { name: "HR Admin", email: "hradmin@cdbl.test", role: "hr_admin" },
    { name: "HR Head", email: "hrhead@cdbl.test", role: "hr_head" },
    { name: "CEO", email: "ceo@cdbl.test", role: "ceo" },
  ];
  for (const u of seed) {
    await User.updateOne({ email: u.email }, { $setOnInsert: u }, { upsert: true });
  }
  const all = await User.find().lean();
  return NextResponse.json({ ok: true, count: all.length });
}
