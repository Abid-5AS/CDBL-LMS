import { prisma } from "@/lib/prisma";
import { addMonths, format } from "date-fns";
import type { LeaveType, LeaveStatus } from "@prisma/client";

export type LeaveHistoryEntry = {
  id: number;
  type: LeaveType;
  start: string;
  end: string;
  days: number;
  status: LeaveStatus;
};

export type LeaveBalanceEntry = {
  type: "Casual" | "Sick" | "Earned";
  used: number;
  total: number;
  remaining: number;
};

export type LeaveTrendPoint = {
  month: string;
  leavesTaken: number;
};

export type LeaveDistributionSlice = {
  type: string;
  value: number;
};

export type EmployeeStats = {
  employeesOnLeave: number;
  pendingRequests: number;
  avgApprovalTime: number;
  totalLeavesThisYear: number;
  encashmentPending: number;
};

export type EmployeeDashboardData = {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  designation?: string | null;
  manager?: string | null;
  joiningDate?: string | null;
  employmentStatus?: string | null;
  stats: EmployeeStats;
  balances: LeaveBalanceEntry[];
  monthlyTrend: LeaveTrendPoint[];
  distribution: LeaveDistributionSlice[];
  history: LeaveHistoryEntry[];
  pendingRequestId?: number | null;
};

function round(value: number, digits = 1) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

function normaliseBalance(type: LeaveType) {
  switch (type) {
    case "CASUAL":
      return "Casual";
    case "MEDICAL":
      return "Sick";
    case "EARNED":
      return "Earned";
    default:
      return type.toLowerCase();
  }
}

export async function getEmployeeDashboardData(employeeId: number): Promise<EmployeeDashboardData | null> {
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
    },
  });

  if (!user) return null;

  const currentYear = new Date().getFullYear();

  const [leaveRequests, balances] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { requesterId: user.id },
      orderBy: { startDate: "desc" },
    }),
    prisma.balance.findMany({
      where: { userId: user.id, year: currentYear },
    }),
  ]);

  const history: LeaveHistoryEntry[] = leaveRequests.slice(0, 10).map((leave) => ({
    id: leave.id,
    type: leave.type,
    start: leave.startDate.toISOString(),
    end: leave.endDate.toISOString(),
    days: leave.workingDays,
    status: leave.status,
  }));

  const balancesSummary: LeaveBalanceEntry[] = balances.map((balance) => {
    const total = (balance.opening ?? 0) + (balance.accrued ?? 0);
    const used = balance.used ?? 0;
    const remaining = balance.closing ?? Math.max(total - used, 0);
    return {
      type: normaliseBalance(balance.type) as LeaveBalanceEntry["type"],
      total,
      used,
      remaining,
    };
  });

  const trendMap = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i -= 1) {
    const ref = addMonths(now, -i);
    const key = format(ref, "MMM");
    trendMap.set(key, 0);
  }
  leaveRequests.forEach((leave) => {
    const key = format(leave.startDate, "MMM");
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + leave.workingDays);
    }
  });
  const monthlyTrend: LeaveTrendPoint[] = Array.from(trendMap.entries()).map(([month, leavesTaken]) => ({
    month,
    leavesTaken,
  }));

  const distributionMap = new Map<string, number>();
  leaveRequests.forEach((leave) => {
    distributionMap.set(leave.type, (distributionMap.get(leave.type) ?? 0) + leave.workingDays);
  });
  const distribution: LeaveDistributionSlice[] = Array.from(distributionMap.entries()).map(([type, value]) => ({
    type,
    value,
  }));

  const thisYearLeaves = leaveRequests.filter((leave) => leave.startDate.getFullYear() === currentYear);
  const totalLeavesThisYear = thisYearLeaves.reduce((acc, leave) => acc + leave.workingDays, 0);

  const approvedLeaves = leaveRequests.filter((leave) => leave.status === "APPROVED");
  const avgApprovalTime =
    approvedLeaves.length > 0
      ? round(
          approvedLeaves.reduce((acc, leave) => {
            const diff = leave.updatedAt.getTime() - leave.createdAt.getTime();
            return acc + diff / (1000 * 60 * 60 * 24);
          }, 0) / approvedLeaves.length,
        )
      : 0;

  const nowDate = new Date();
  const employeesOnLeave = leaveRequests.filter(
    (leave) => leave.status === "APPROVED" && leave.startDate <= nowDate && leave.endDate >= nowDate,
  ).length;

  const pendingRequests = leaveRequests.filter((leave) => leave.status === "PENDING" || leave.status === "SUBMITTED");

  const stats: EmployeeStats = {
    employeesOnLeave,
    pendingRequests: pendingRequests.length,
    avgApprovalTime,
    totalLeavesThisYear,
    encashmentPending: 0,
  };

  const latestPending = pendingRequests.at(0);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: null,
    manager: null,
    joiningDate: null,
    employmentStatus: "Active",
    stats,
    balances: balancesSummary,
    monthlyTrend,
    distribution,
    history,
    pendingRequestId: latestPending?.id ?? null,
  };
}
