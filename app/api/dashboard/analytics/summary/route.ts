import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

export const cache = "no-store";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Get query parameter
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "year"; // default: year

  const today = normalizeToDhakaMidnight(new Date());
  const year = today.getFullYear();
  let startDate: Date;
  let endDate: Date;

  // Determine date range based on period
  if (period === "month") {
    const month = today.getMonth();
    startDate = normalizeToDhakaMidnight(new Date(year, month, 1));
    endDate = normalizeToDhakaMidnight(new Date(year, month + 1, 0));
  } else if (period === "quarter") {
    const quarter = Math.floor(today.getMonth() / 3);
    startDate = normalizeToDhakaMidnight(new Date(year, quarter * 3, 1));
    endDate = normalizeToDhakaMidnight(new Date(year, (quarter + 1) * 3, 0));
  } else {
    // year
    startDate = normalizeToDhakaMidnight(new Date(year, 0, 1));
    endDate = normalizeToDhakaMidnight(new Date(year, 11, 31));
  }

  // Get balances for current year
  const balances = await prisma.balance.findMany({
    where: { userId: me.id, year },
  });

  const earnedBalance = balances.find((b) => b.type === "EARNED");
  const casualBalance = balances.find((b) => b.type === "CASUAL");
  const medicalBalance = balances.find((b) => b.type === "MEDICAL");

  const remainingAll = (earnedBalance?.closing ?? 0) + (casualBalance?.closing ?? 0) + (medicalBalance?.closing ?? 0);

  // Get ALL approved leave requests for the entire year (for yearUsed calculation)
  const yearStart = normalizeToDhakaMidnight(new Date(year, 0, 1));
  const yearEnd = normalizeToDhakaMidnight(new Date(year, 11, 31));
  
  const allYearLeaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: me.id,
      status: "APPROVED",
      startDate: { lte: yearEnd },
      endDate: { gte: yearStart },
    },
    select: {
      type: true,
      workingDays: true,
      startDate: true,
    },
  });

  // Calculate year used (all approved leaves in the year - YTD, always independent of period filter)
  const yearUsed = allYearLeaves.reduce((sum, leave) => sum + leave.workingDays, 0);

  // Calculate month used (current month)
  const currentMonth = today.getMonth();
  const monthStart = normalizeToDhakaMidnight(new Date(year, currentMonth, 1));
  const monthEnd = normalizeToDhakaMidnight(new Date(year, currentMonth + 1, 0));
  
  const monthLeaves = allYearLeaves.filter((leave) => {
    const leaveStart = normalizeToDhakaMidnight(leave.startDate);
    return leaveStart >= monthStart && leaveStart <= monthEnd;
  });
  
  const monthUsed = monthLeaves.reduce((sum, leave) => sum + leave.workingDays, 0);

  // Calculate quarter used (current quarter)
  const quarter = Math.floor(currentMonth / 3);
  const quarterStart = normalizeToDhakaMidnight(new Date(year, quarter * 3, 1));
  const quarterEnd = normalizeToDhakaMidnight(new Date(year, (quarter + 1) * 3, 0));
  
  const quarterLeaves = allYearLeaves.filter((leave) => {
    const leaveStart = normalizeToDhakaMidnight(leave.startDate);
    return leaveStart >= quarterStart && leaveStart <= quarterEnd;
  });
  
  const quarterUsed = quarterLeaves.reduce((sum, leave) => sum + leave.workingDays, 0);

  // Calculate distribution by type (use all year leaves for accurate distribution)
  const earnedUsed = allYearLeaves.filter((l) => l.type === "EARNED").reduce((sum, l) => sum + l.workingDays, 0);
  const casualUsed = allYearLeaves.filter((l) => l.type === "CASUAL").reduce((sum, l) => sum + l.workingDays, 0);
  const medicalUsed = allYearLeaves.filter((l) => l.type === "MEDICAL").reduce((sum, l) => sum + l.workingDays, 0);

  const distribution = [
    { type: "EARNED", days: earnedUsed },
    { type: "CASUAL", days: casualUsed },
    { type: "MEDICAL", days: medicalUsed },
  ].filter((d) => d.days > 0);

  return NextResponse.json({
    period,
    summary: {
      monthUsed,
      quarterUsed,
      yearUsed,
      remainingAll,
    },
    distribution,
  });
}


