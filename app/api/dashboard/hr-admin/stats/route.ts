import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/dashboard/hr-admin/stats
 *
 * Returns comprehensive statistics for HR_ADMIN dashboard
 * - Employees on leave today
 * - Pending requests
 * - Average approval time
 * - Encashment pending
 * - Total leaves this year
 * - Processed today
 * - Daily processing target progress
 * - Team utilization rate
 * - Policy compliance score
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    // Parallel queries for optimal performance
    const [
      employeesOnLeave,
      pendingRequests,
      approvalTimeData,
      encashmentPending,
      totalLeavesThisYear,
      processedToday,
      totalEmployees,
      leaveRequestsThisYear,
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

      // Average approval time (approved requests in last 30 days)
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
      }),

      // Encashment pending (placeholder - not yet implemented in schema)
      Promise.resolve(0), // TODO: Implement encashment feature

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

      // Total employees
      prisma.user.count({
        where: {
          role: {
            in: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"],
          },
        },
      }),

      // All leave requests this year
      prisma.leaveRequest.findMany({
        where: {
          startDate: {
            gte: startOfYear,
            lt: startOfNextYear,
          },
        },
        select: {
          workingDays: true,
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

    // Calculate team utilization (average leave days per employee)
    const totalLeaveDays = leaveRequestsThisYear.reduce(
      (sum, req) => sum + req.workingDays,
      0
    );
    const avgLeaveDaysPerEmployee =
      totalEmployees > 0 ? totalLeaveDays / totalEmployees : 0;
    // Fixed: Team utilization should be inverse of leave usage
    // Higher leave usage = lower team availability
    const teamUtilization = Math.max(
      100 - Math.min(Math.round((avgLeaveDaysPerEmployee / 24) * 100), 100),
      0
    ); // Assuming 24 days per year average

    // Daily target (assuming 10 requests per day target)
    const dailyTarget = 10;
    const dailyProgress = Math.min(
      Math.round((processedToday / dailyTarget) * 100),
      100
    );

    // Policy compliance score (placeholder calculation)
    // In a real system, this would check for policy violations
    const complianceScore = 94;

    // Get leave type breakdown
    const leaveTypeBreakdown = await prisma.leaveRequest.groupBy({
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
    });

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await prisma.leaveRequest.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // Process monthly trend data
    const trendByMonth: { [key: string]: number } = {};
    monthlyTrend.forEach((item) => {
      const monthKey = `${item.createdAt.getFullYear()}-${String(
        item.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;
      trendByMonth[monthKey] = (trendByMonth[monthKey] || 0) + item._count.id;
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
      monthlyTrend: Object.entries(trendByMonth).map(([month, count]) => ({
        month,
        count,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching HR_ADMIN stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
