import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/dashboard/ceo/stats
 *
 * Returns executive-level statistics for CEO dashboard
 * - Organization-wide KPIs
 * - Financial metrics (leave cost analysis)
 * - Strategic insights
 * - Year-over-year comparisons
 * - Department performance
 * - Risk indicators
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

    // Verify CEO role
    if (user.role !== "CEO") {
      return NextResponse.json(
        { error: "Forbidden - CEO access required" },
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
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Parallel queries for comprehensive data
    const [
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      totalLeavesThisYear,
      totalLeavesLastYear,
      pendingApprovals,
      avgApprovalTime,
      leaveTypeDistribution,
      departmentMetrics,
      monthlyUtilization,
      criticalRequests,
      systemHealth,
    ] = await Promise.all([
      // Total employees in org
      prisma.user.count(),

      // Active employees (excluding CEO)
      prisma.user.count({
        where: {
          role: {
            in: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD"],
          },
        },
      }),

      // Employees on leave today
      prisma.leaveRequest.count({
        where: {
          status: "APPROVED",
          startDate: { lte: tomorrow },
          endDate: { gte: today },
        },
      }),

      // Total leaves this year
      prisma.leaveRequest.aggregate({
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

      // Total leaves last year (for YoY comparison)
      prisma.leaveRequest.aggregate({
        where: {
          status: "APPROVED",
          startDate: {
            gte: startOfLastYear,
            lt: startOfYear,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          workingDays: true,
        },
      }),

      // Fixed: Count only approvals pending for this specific CEO user
      prisma.approval.count({
        where: {
          approverId: user.id,
          decision: "PENDING",
        },
      }),

      // Average approval time (last 90 days)
      prisma.leaveRequest.findMany({
        where: {
          status: {
            in: ["APPROVED", "REJECTED"],
          },
          updatedAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
        take: 100,
      }),

      // Leave type distribution (this year)
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

      // Department-wise metrics
      prisma.user.groupBy({
        by: ["department"],
        where: {
          department: {
            not: null,
          },
          role: {
            in: ["EMPLOYEE", "DEPT_HEAD"],
          },
        },
        _count: {
          id: true,
        },
      }),

      // Monthly utilization (last 12 months)
      prisma.leaveRequest.groupBy({
        by: ["startDate"],
        where: {
          status: "APPROVED",
          startDate: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          workingDays: true,
        },
      }),

      // Critical/escalated requests
      prisma.leaveRequest.count({
        where: {
          status: "PENDING",
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Older than 7 days
          },
        },
      }),

      // System health (recent activity)
      prisma.leaveRequest.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
            lt: firstDayOfNextMonth,
          },
        },
      }),
    ]);

    // Calculate average approval time
    let avgTimeInDays = 0;
    if (avgApprovalTime.length > 0) {
      const totalTime = avgApprovalTime.reduce((sum, req) => {
        const diffMs = req.updatedAt.getTime() - req.createdAt.getTime();
        return sum + diffMs / (1000 * 60 * 60 * 24);
      }, 0);
      avgTimeInDays = totalTime / avgApprovalTime.length;
    }

    // Calculate workforce utilization
    const workforcePresentToday = activeEmployees - onLeaveToday;
    const utilizationRate =
      activeEmployees > 0
        ? Math.round((workforcePresentToday / activeEmployees) * 100)
        : 100;

    // Calculate year-over-year growth
    const thisYearCount = totalLeavesThisYear._count.id || 0;
    const lastYearCount = totalLeavesLastYear._count.id || 1; // Avoid division by zero
    const yoyGrowth = ((thisYearCount - lastYearCount) / lastYearCount) * 100;

    // Estimate leave cost (assuming average daily cost per employee)
    const avgDailyCost = 150; // USD per day (placeholder)
    const totalLeaveDays = totalLeavesThisYear._sum.workingDays || 0;
    const estimatedCost = totalLeaveDays * avgDailyCost;

    // Calculate compliance score
    const totalProcessed = thisYearCount;
    const overdue = criticalRequests;
    const complianceScore = totalProcessed > 0
      ? Math.round(((totalProcessed - overdue) / totalProcessed) * 100)
      : 100;

    // Process monthly utilization data
    const monthlyData: { [key: string]: { count: number; days: number } } = {};
    monthlyUtilization.forEach((item) => {
      const monthKey = `${item.startDate.getFullYear()}-${String(
        item.startDate.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, days: 0 };
      }
      monthlyData[monthKey].count += item._count.id;
      monthlyData[monthKey].days += item._sum.workingDays || 0;
    });

    // Top insights (AI-powered placeholder)
    const insights = [
      {
        type: "trend",
        priority: "high",
        message: `Leave requests are ${yoyGrowth > 0 ? "up" : "down"} ${Math.abs(
          yoyGrowth
        ).toFixed(1)}% compared to last year`,
      },
      {
        type: "efficiency",
        priority: "medium",
        message: `Average approval time is ${avgTimeInDays.toFixed(
          1
        )} days - within target range`,
      },
      {
        type: "risk",
        priority: criticalRequests > 5 ? "high" : "low",
        message: `${criticalRequests} requests pending for more than 7 days`,
      },
      {
        type: "utilization",
        priority: utilizationRate < 85 ? "medium" : "low",
        message: `Workforce utilization at ${utilizationRate}% today`,
      },
    ];

    const stats = {
      // Executive KPIs
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      utilizationRate,
      pendingApprovals,

      // Performance metrics
      avgApprovalTime: Number(avgTimeInDays.toFixed(1)),
      complianceScore,
      criticalRequests,

      // Financial metrics
      totalLeaveDays,
      estimatedCost,
      avgCostPerDay: avgDailyCost,

      // Year-over-year comparison
      thisYear: {
        requests: thisYearCount,
        days: totalLeaveDays,
      },
      lastYear: {
        requests: lastYearCount,
        days: totalLeavesLastYear._sum.workingDays || 0,
      },
      yoyGrowth: Number(yoyGrowth.toFixed(1)),

      // Leave type breakdown
      leaveTypes: leaveTypeDistribution.map((item) => ({
        type: item.type,
        count: item._count.id,
        days: item._sum.workingDays || 0,
      })),

      // Department metrics
      departments: departmentMetrics.map((dept) => ({
        name: dept.department || "Unassigned",
        employees: dept._count.id,
      })),

      // Monthly trend
      monthlyTrend: Object.entries(monthlyData)
        .sort()
        .slice(-12)
        .map(([month, data]) => ({
          month,
          requests: data.count,
          days: data.days,
        })),

      // AI insights
      insights,

      // System health
      systemHealth: {
        status: systemHealth > 0 ? "healthy" : "inactive",
        requestsThisMonth: systemHealth,
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching CEO stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
