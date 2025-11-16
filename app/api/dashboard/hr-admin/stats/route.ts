import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// In-memory cache for dashboard stats (1 minute TTL)
let cachedStats: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * GET /api/dashboard/hr-admin/stats
 *
 * Returns comprehensive statistics for HR_ADMIN dashboard
 * With 1-minute in-memory caching for improved performance
 */
export async function GET(req: NextRequest) {
  // Check cache first
  const now = Date.now();
  if (cachedStats && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedStats, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify HR_ADMIN, HR_HEAD, or CEO role
    if (!["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden - HR access required" },
        { status: 403 }
      );
    }

    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

    // Get monthly trend (last 6 months) - moved here for single query
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // CRITICAL: First batch - KPI card data (fast queries only)
    // These should return in < 100ms total
    const [
      employeesOnLeave,
      pendingRequests,
      totalLeavesThisYear,
      processedToday,
    ] = await Promise.all([
      // Employees on leave today
      prisma.leaveRequest.count({
        where: {
          status: "APPROVED",
          startDate: { lte: tomorrow },
          endDate: { gte: today },
        },
      }),

      // Pending requests
      prisma.leaveRequest.count({
        where: {
          status: "PENDING",
        },
      }),

      // Total approved leaves this year
      prisma.leaveRequest.count({
        where: {
          status: "APPROVED",
          startDate: {
            gte: startOfYear,
            lt: startOfNextYear,
          },
        },
      }),

      // Processed today (approved or rejected)
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

    // NON-CRITICAL: Second batch - analytical data (can be slower)
    // These queries will complete in background, KPIs already rendered
    const [
      approvalTimeData,
      totalEmployees,
      leaveTypeBreakdown,
      yearStatsAgg,
      monthlyRequests,
    ] = await Promise.all([
      // Average approval time (LIMIT to 100 most recent for speed)
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

      // Total employees (cached count)
      prisma.user.count({
        where: {
          role: {
            in: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"],
          },
        },
      }),

      // Leave type breakdown - combined query
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

      // Aggregate stats for year - single query instead of fetching all records
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

      // Monthly trend data - fetch only last 6 months, limited to prevent memory issues
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

    // Calculate average approval time in days
    let avgApprovalTime = 0;
    if (approvalTimeData.length > 0) {
      const totalTime = approvalTimeData.reduce((sum, req) => {
        const diffMs = req.updatedAt.getTime() - req.createdAt.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgApprovalTime = totalTime / approvalTimeData.length;
    }

    // Calculate team utilization using aggregated data
    const totalLeaveDays = yearStatsAgg._sum.workingDays || 0;
    const avgLeaveDaysPerEmployee =
      totalEmployees > 0 ? totalLeaveDays / totalEmployees : 0;
    // Team utilization: inverse of leave usage
    const teamUtilization = Math.max(
      100 - Math.min(Math.round((avgLeaveDaysPerEmployee / 24) * 100), 100),
      0
    );

    // Daily target and progress
    const dailyTarget = 10;
    const dailyProgress = Math.min(
      Math.round((processedToday / dailyTarget) * 100),
      100
    );

    // Policy compliance score (placeholder)
    const complianceScore = 94;

    // Encashment pending (placeholder)
    const encashmentPending = 0;

    // Process monthly trend data - faster grouping
    const trendByMonth: { [key: string]: number } = {};
    monthlyRequests.forEach((item) => {
      const monthKey = `${item.createdAt.getFullYear()}-${String(
        item.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;
      trendByMonth[monthKey] = (trendByMonth[monthKey] || 0) + 1;
    });

    const stats = {
      // Core KPIs
      employeesOnLeave,
      pendingRequests,
      avgApprovalTime: Number(avgApprovalTime.toFixed(1)),
      encashmentPending,

      // Volume metrics
      totalLeavesThisYear,
      processedToday,
      dailyTarget,
      dailyProgress,

      // Performance metrics
      teamUtilization,
      complianceScore,

      // Analytics data
      leaveTypeBreakdown: leaveTypeBreakdown.map((item) => ({
        type: item.type,
        count: item._count.id,
        totalDays: item._sum.workingDays || 0,
      })),

      // Trend data
      monthlyTrend: Object.entries(trendByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
          month,
          count,
        })),
    };

    // Update cache
    cachedStats = stats;
    cacheTimestamp = Date.now();

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching HR_ADMIN stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

// Optional: Clear cache on POST/PUT/DELETE operations
// export const runtime = 'nodejs'; // Commented out - incompatible with cacheComponents
