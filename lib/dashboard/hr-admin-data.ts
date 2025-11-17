import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@prisma/client";

export type HRAdminDashboardStats = {
  employeesOnLeave: number;
  pendingRequests: number;
  avgApprovalTime: number;
  encashmentPending: number;
  totalLeavesThisYear: number;
  processedToday: number;
  dailyTarget: number;
  dailyProgress: number;
  teamUtilization: number;
  complianceScore: number;
  leaveTypeBreakdown: Array<{
    type: string;
    count: number;
    totalDays: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
};

export class DashboardAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type MinimalUser = Pick<User, "role" | "id" | "email" | "name"> | null | undefined;

const ALLOWED_ROLES = new Set(["HR_ADMIN", "HR_HEAD", "CEO"]);

async function resolveAuthorizedUser(user?: MinimalUser) {
  const resolved = user ?? (await getCurrentUser());
  if (!resolved) {
    throw new DashboardAccessError("Unauthorized", 401);
  }
  if (!ALLOWED_ROLES.has(resolved.role)) {
    throw new DashboardAccessError("Forbidden - HR access required", 403);
  }
  return resolved;
}

const statsCache: {
  data: HRAdminDashboardStats;
  timestamp: number;
} = {
  data: {
    employeesOnLeave: 0,
    pendingRequests: 0,
    avgApprovalTime: 0,
    encashmentPending: 0,
    totalLeavesThisYear: 0,
    processedToday: 0,
    dailyTarget: 10,
    dailyProgress: 0,
    teamUtilization: 0,
    complianceScore: 0,
    leaveTypeBreakdown: [],
    monthlyTrend: [],
  },
  timestamp: 0,
};

let hasCachedStats = false;
const STATS_CACHE_TTL = 60 * 1000;

export function invalidateHRAdminStatsCache() {
  hasCachedStats = false;
  statsCache.timestamp = 0;
}

export async function getHRAdminKPIData(user?: MinimalUser): Promise<HRAdminDashboardStats> {
  const resolvedUser = await resolveAuthorizedUser(user);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    employeesOnLeave,
    pendingRequests,
    totalLeavesThisYear,
    processedToday,
    recentApprovals,
    totalEmployees,
  ] = await Promise.all([
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: tomorrow },
        endDate: { gte: today },
      },
    }),
    // Fixed: Count only approvals pending for this specific user
    prisma.approval.count({
      where: {
        approverId: resolvedUser.id,
        decision: "PENDING",
      },
    }),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: {
          gte: startOfYear,
          lt: startOfNextYear,
        },
      },
    }),
    prisma.leaveRequest.count({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"],
        },
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    // Fetch recent approvals for avgApprovalTime calculation
    prisma.leaveRequest.findMany({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"],
        },
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
      take: 100,
      orderBy: {
        updatedAt: "desc",
      },
    }),
    // Total employees for utilization calculation
    prisma.user.count({
      where: {
        role: {
          in: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"],
        },
      },
    }),
  ]);

  // Calculate real avgApprovalTime
  let avgApprovalTime = 2.5; // Default fallback
  if (recentApprovals.length > 0) {
    const totalTime = recentApprovals.reduce((sum, req) => {
      const diffMs = req.updatedAt.getTime() - req.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60 * 24); // Convert to days
    }, 0);
    avgApprovalTime = totalTime / recentApprovals.length;
  }

  // Calculate real teamUtilization
  let teamUtilization = 85; // Default fallback
  if (totalEmployees > 0) {
    const availableEmployees = totalEmployees - employeesOnLeave;
    teamUtilization = Math.round((availableEmployees / totalEmployees) * 100);
  }

  const dailyTarget = 10;
  const dailyProgress = Math.min(
    Math.round((processedToday / dailyTarget) * 100),
    100
  );

  return {
    employeesOnLeave,
    pendingRequests,
    avgApprovalTime, // Now calculated from real data
    // NOT IMPLEMENTED: Encashment tracking not yet available
    encashmentPending: 0,
    totalLeavesThisYear,
    processedToday,
    dailyTarget,
    dailyProgress,
    teamUtilization, // Now calculated from real data
    // PLACEHOLDER: Compliance score calculation not yet implemented
    complianceScore: 94,
    // Empty arrays in fast endpoint, populated in /stats
    leaveTypeBreakdown: [],
    monthlyTrend: [],
  };
}

type StatsOptions = {
  user?: MinimalUser;
  skipCache?: boolean;
};

export async function getHRAdminStatsData(
  options: StatsOptions = {}
): Promise<HRAdminDashboardStats> {
  const resolvedUser = await resolveAuthorizedUser(options.user);
  const nowTs = Date.now();
  if (
    !options.skipCache &&
    hasCachedStats &&
    nowTs - statsCache.timestamp < STATS_CACHE_TTL
  ) {
    return statsCache.data;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    employeesOnLeave,
    pendingRequests,
    totalLeavesThisYear,
    processedToday,
  ] = await Promise.all([
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: tomorrow },
        endDate: { gte: today },
      },
    }),
    // Fixed: Count only approvals pending for this specific user
    prisma.approval.count({
      where: {
        approverId: resolvedUser.id,
        decision: "PENDING",
      },
    }),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: {
          gte: startOfYear,
          lt: startOfNextYear,
        },
      },
    }),
    prisma.leaveRequest.count({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"],
        },
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
  ]);

  const [
    approvalTimeData,
    totalEmployees,
    leaveTypeBreakdown,
    yearStatsAgg,
    monthlyRequests,
  ] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
      take: 100,
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.user.count({
      where: {
        role: {
          in: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"],
        },
      },
    }),
    prisma.leaveRequest.groupBy({
      by: ["type"],
      where: {
        status: "APPROVED",
        startDate: {
          gte: startOfYear,
          lt: startOfNextYear,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        workingDays: true,
      },
    }),
    prisma.leaveRequest.aggregate({
      where: {
        startDate: {
          gte: startOfYear,
          lt: startOfNextYear,
        },
      },
      _sum: {
        workingDays: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  let avgApprovalTime = 0;
  if (approvalTimeData.length > 0) {
    const totalTime = approvalTimeData.reduce((sum, req) => {
      const diffMs = req.updatedAt.getTime() - req.createdAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0);
    avgApprovalTime = totalTime / approvalTimeData.length;
  }

  const totalLeaveDays = yearStatsAgg._sum.workingDays || 0;
  const avgLeaveDaysPerEmployee =
    totalEmployees > 0 ? totalLeaveDays / totalEmployees : 0;
  const teamUtilization = Math.max(
    100 - Math.min(Math.round((avgLeaveDaysPerEmployee / 24) * 100), 100),
    0
  );

  const dailyTarget = 10;
  const dailyProgress = Math.min(
    Math.round((processedToday / dailyTarget) * 100),
    100
  );

  const trendByMonth: Record<string, number> = {};
  monthlyRequests.forEach((item) => {
    const monthKey = `${item.createdAt.getFullYear()}-${String(
      item.createdAt.getMonth() + 1
    ).padStart(2, "0")}`;
    trendByMonth[monthKey] = (trendByMonth[monthKey] || 0) + 1;
  });

  const stats: HRAdminDashboardStats = {
    employeesOnLeave,
    pendingRequests,
    avgApprovalTime: Number(avgApprovalTime.toFixed(1)),
    encashmentPending: 0,
    totalLeavesThisYear,
    processedToday,
    dailyTarget,
    dailyProgress,
    teamUtilization,
    complianceScore: 94,
    leaveTypeBreakdown: leaveTypeBreakdown.map((item) => ({
      type: item.type,
      count: item._count.id,
      totalDays: item._sum.workingDays || 0,
    })),
    monthlyTrend: Object.entries(trendByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
  };

  statsCache.data = stats;
  statsCache.timestamp = nowTs;
  hasCachedStats = true;

  return stats;
}
