import { format, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { LeaveTrendChart } from "./LeaveTrendChart";

type ChartData = {
  month: string;
  leaves: number;
};

async function getLeaveTrendData(): Promise<ChartData[]> {
  const now = new Date();
  const data: ChartData[] = [];

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

  return data;
}

export async function LeaveTrendChartData() {
  const data = await getLeaveTrendData();
  return <LeaveTrendChart data={data} />;
}

