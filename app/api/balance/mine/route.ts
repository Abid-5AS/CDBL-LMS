import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveType } from "@prisma/client";

export const cache = "no-store";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const year = new Date().getFullYear();
  const balances = await prisma.balance.findMany({
    where: { userId: me.id, year },
  });

  const remaining = (type: LeaveType) => {
    const record = balances.find((b) => b.type === type);
    if (!record) return 0;
    return (record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0);
  };

  return NextResponse.json({
    year,
    EARNED: remaining("EARNED"),
    CASUAL: remaining("CASUAL"),
    MEDICAL: remaining("MEDICAL"),
  });
}
