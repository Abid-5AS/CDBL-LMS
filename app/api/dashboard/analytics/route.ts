import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

export const cache = "no-store";

interface MonthlyUsage {
  month: number;
  monthName: string;
  earned: number;
  casual: number;
  medical: number;
  total: number;
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Check for window parameter (rolling vs full year)
  const { searchParams } = new URL(req.url);
  const window = searchParams.get("window") || "year"; // default: full year

  const year = new Date().getFullYear();
  const today = normalizeToDhakaMidnight(new Date());

  // Determine date range based on mode
  let startDate: Date;
  let endDate: Date;

  if (window === "rolling12") {
    // Rolling 12 months: from 12 months ago to today
    startDate = normalizeToDhakaMidnight(new Date(today));
    startDate.setMonth(startDate.getMonth() - 12);
    endDate = today;
  } else {
    // Full calendar year: Jan 1 to Dec 31
    startDate = normalizeToDhakaMidnight(new Date(year, 0, 1));
    endDate = normalizeToDhakaMidnight(new Date(year, 11, 31));
  }

  // Fetch all leave requests for the date range
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: me.id,
      status: {
        in: ["APPROVED"],
      },
      startDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      type: true,
      workingDays: true,
      startDate: true,
      endDate: true,
    },
  });

  // Initialize monthly usage
  const monthlyUsage: MonthlyUsage[] = [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  for (let i = 0; i < 12; i++) {
    monthlyUsage.push({
      month: i + 1,
      monthName: monthNames[i],
      earned: 0,
      casual: 0,
      medical: 0,
      total: 0,
    });
  }

  // Aggregate usage by month and type
  leaves.forEach((leave) => {
    const startMonth = new Date(leave.startDate).getMonth();
    const monthData = monthlyUsage[startMonth];

    if (!monthData) return;

    monthData.total += leave.workingDays ?? 0;

    switch (leave.type) {
      case "EARNED":
        monthData.earned += leave.workingDays ?? 0;
        break;
      case "CASUAL":
        monthData.casual += leave.workingDays ?? 0;
        break;
      case "MEDICAL":
        monthData.medical += leave.workingDays ?? 0;
        break;
    }
  });

  // Calculate totals and projections
  const totalUsed = leaves.reduce((sum, leave) => sum + (leave.workingDays ?? 0), 0);
  const earnedUsed = leaves.filter(l => l.type === "EARNED").reduce((sum, leave) => sum + (leave.workingDays ?? 0), 0);
  const casualUsed = leaves.filter(l => l.type === "CASUAL").reduce((sum, leave) => sum + (leave.workingDays ?? 0), 0);
  const medicalUsed = leaves.filter(l => l.type === "MEDICAL").reduce((sum, leave) => sum + (leave.workingDays ?? 0), 0);

  // Calculate projected usage based on current month
  const currentMonth = today.getMonth();
  const monthsElapsed = currentMonth + 1;
  const projectedAnnualUsage = monthsElapsed < 12 ? Math.round((totalUsed / monthsElapsed) * 12) : totalUsed;

  // Get balances
  const balances = await prisma.balance.findMany({
    where: { userId: me.id, year },
  });

  const remaining = (type: string) => {
    const record = balances.find((b) => b.type === type);
    if (!record) return 0;
    return (record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0);
  };

  const earned = remaining("EARNED");
  const casual = remaining("CASUAL");
  const medical = remaining("MEDICAL");

  // Calculate utilization percentages
  const earnedUtilization = earnedUsed > 0 && (earned + earnedUsed) > 0
    ? Math.round((earnedUsed / (earned + earnedUsed)) * 100)
    : 0;
  const casualUtilization = casualUsed > 0 && (casual + casualUsed) > 0
    ? Math.round((casualUsed / (casual + casualUsed)) * 100)
    : 0;
  const medicalUtilization = medicalUsed > 0 && (medical + medicalUsed) > 0
    ? Math.round((medicalUsed / (medical + medicalUsed)) * 100)
    : 0;

  // Generate heatmap data: array of { date, count, types }
  const heatmapData: Array<{ date: string; count: number; types: string[] }> = [];
  const heatmapMap = new Map<string, { count: number; types: Set<string> }>();

  // Iterate through all days in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = normalizeToDhakaMidnight(currentDate).toISOString().slice(0, 10);
    heatmapMap.set(dateKey, { count: 0, types: new Set() });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Mark days that have leave
  leaves.forEach((leave) => {
    const leaveStart = normalizeToDhakaMidnight(leave.startDate);
    const leaveEnd = normalizeToDhakaMidnight(leave.endDate);
    const currentDate = new Date(leaveStart);

    while (currentDate <= leaveEnd) {
      const dateKey = normalizeToDhakaMidnight(currentDate).toISOString().slice(0, 10);
      const entry = heatmapMap.get(dateKey);
      if (entry) {
        entry.count += 1;
        entry.types.add(leave.type);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  // Convert map to array
  heatmapMap.forEach((value, date) => {
    if (value.count > 0) {
      heatmapData.push({
        date,
        count: value.count,
        types: Array.from(value.types),
      });
    }
  });

  return NextResponse.json({
    period: window,
    summary: {
      monthUsed: monthlyUsage[new Date().getMonth()]?.total ?? 0,
      yearUsed: totalUsed,
      remainingAll: earned + casual + medical,
    },
    monthlyUsage,
    heatmap: heatmapData.map((item) => ({
      date: item.date,
      value: item.count,
      type: item.types[0] || "UNKNOWN",
    })),
    distribution: [
      { type: "EARNED", days: earnedUsed, pct: totalUsed > 0 ? Math.round((earnedUsed / totalUsed) * 100) : 0 },
      { type: "CASUAL", days: casualUsed, pct: totalUsed > 0 ? Math.round((casualUsed / totalUsed) * 100) : 0 },
      { type: "MEDICAL", days: medicalUsed, pct: totalUsed > 0 ? Math.round((medicalUsed / totalUsed) * 100) : 0 },
    ].filter((d) => d.days > 0),
  });
}
