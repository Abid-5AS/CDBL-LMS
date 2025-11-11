import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveType } from "@prisma/client";

export const cache = "no-store";

export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get("detailed") === "true";

  const year = new Date().getFullYear();
  const balances = await prisma.balance.findMany({
    where: { userId: me.id, year },
  });

  const remaining = (type: LeaveType) => {
    const record = balances.find((b) => b.type === type);
    if (!record) return 0;
    // Use closing balance if available, otherwise calculate from opening + accrued - used
    if (record.closing !== null && record.closing !== undefined) {
      return record.closing;
    }
    return Math.max((record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0), 0);
  };

  // Return detailed balance breakdown if requested
  if (detailed) {
    const detailedBalances = (["EARNED", "CASUAL", "MEDICAL"] as LeaveType[]).map((type) => {
      const record = balances.find((b) => b.type === type);
      return {
        type,
        opening: record?.opening ?? 0,
        accrued: record?.accrued ?? 0,
        used: record?.used ?? 0,
        closing: record?.closing ?? remaining(type),
      };
    });

    return NextResponse.json({
      year,
      balances: detailedBalances,
    });
  }

  // Return simple remaining balances (backward compatible)
  return NextResponse.json({
    year,
    EARNED: remaining("EARNED"),
    CASUAL: remaining("CASUAL"),
    MEDICAL: remaining("MEDICAL"),
  });
}
