import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { format, subMonths } from "date-fns";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN
  if (!["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const data: { month: string; leaves: number }[] = [];

  // Get last 12 months
  for (let i = 11; i >= 0; i--) {
    const monthStart = subMonths(now, i);
    const monthEnd = subMonths(now, i - 1);
    const monthKey = format(monthStart, "MMM");

    const count = await prisma.leaveRequest.count({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    });

    data.push({
      month: monthKey,
      leaves: count,
    });
  }

  return NextResponse.json({ data });
}






