import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { LeaveTypePieChart } from "./LeaveTypePieChart";

type ChartData = {
  name: string;
  value: number;
};

async function getLeaveTypeDistribution(): Promise<ChartData[]> {
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      status: LeaveStatus.APPROVED,
    },
    select: {
      type: true,
    },
  });

  const distribution = new Map<string, number>();
  leaves.forEach((leave) => {
    const count = distribution.get(leave.type) || 0;
    distribution.set(leave.type, count + 1);
  });

  return Array.from(distribution.entries()).map(([type, count]) => ({
    name: type.replace("_", " "),
    value: count,
  }));
}

export async function LeaveTypePieChartData() {
  const data = await getLeaveTypeDistribution();
  return <LeaveTypePieChart data={data} />;
}

