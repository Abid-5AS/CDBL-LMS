import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

interface MonthlyUsage {
  month: number;
  monthName: string;
  earned: number;
  casual: number;
  medical: number;
  total: number;
}

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all leave requests for the current year
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: me.id,
      status: {
        in: ["APPROVED"],
      },
      startDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
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

  return NextResponse.json({
    monthlyUsage,
    summary: {
      totalUsed,
      projectedAnnualUsage,
      utilization: {
        earned: earnedUtilization,
        casual: casualUtilization,
        medical: medicalUtilization,
      },
      breakdown: {
        earned: earnedUsed,
        casual: casualUsed,
        medical: medicalUsed,
      },
    },
  });
}

