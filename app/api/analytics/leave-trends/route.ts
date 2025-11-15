import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveRequestStatus } from "@prisma/client";

/**
 * GET /api/analytics/leave-trends
 *
 * Returns analytics data for leave trends, department utilization, and type breakdown
 *
 * Query params:
 * - period: "1m" | "3m" | "6m" | "12m" (default: "12m")
 * - department: string (optional - filter by department)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin roles to access analytics
    if (!["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN", "DEPT_HEAD"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "12m";
    const departmentFilter = searchParams.get("department");

    // Calculate date range based on period
    const now = new Date();
    const monthsBack = parseInt(period.replace("m", ""));
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

    // Build where clause
    let whereClause: any = {
      createdAt: {
        gte: startDate,
      },
    };

    // Department filter for Dept Head role
    if (user.role === "DEPT_HEAD" && user.departmentId) {
      whereClause.user = {
        departmentId: user.departmentId,
      };
    } else if (departmentFilter) {
      whereClause.user = {
        department: {
          name: departmentFilter,
        },
      };
    }

    // Fetch all relevant leaves
    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate monthly trend
    const monthlyTrend: any[] = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthLeaves = leaves.filter((leave) => {
        const createdAt = new Date(leave.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });

      monthlyTrend.push({
        month: monthNames[monthDate.getMonth()],
        leaves: monthLeaves.length,
        approved: monthLeaves.filter((l) => l.status === LeaveRequestStatus.APPROVED)
          .length,
        rejected: monthLeaves.filter((l) => l.status === LeaveRequestStatus.REJECTED)
          .length,
      });
    }

    // Calculate leave type breakdown
    const typeMap = new Map<string, { count: number; days: number }>();
    leaves.forEach((leave) => {
      const existing = typeMap.get(leave.type) || { count: 0, days: 0 };
      typeMap.set(leave.type, {
        count: existing.count + 1,
        days: existing.days + leave.workingDays,
      });
    });

    const totalLeaves = leaves.length;
    const leaveTypeBreakdown = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      days: data.days,
      percentage: totalLeaves > 0 ? (data.count / totalLeaves) * 100 : 0,
    }));

    // Calculate department utilization
    const deptMap = new Map<
      string,
      { totalDays: number; employeeIds: Set<number> }
    >();

    leaves.forEach((leave) => {
      const deptName = leave.user.department?.name || "Unknown";
      const existing = deptMap.get(deptName) || {
        totalDays: 0,
        employeeIds: new Set(),
      };
      existing.totalDays += leave.workingDays;
      existing.employeeIds.add(leave.userId);
      deptMap.set(deptName, existing);
    });

    const departmentUtilization = await Promise.all(
      Array.from(deptMap.entries()).map(async ([department, data]) => {
        // Get total employees in department
        const dept = await prisma.department.findFirst({
          where: { name: department },
          include: {
            _count: {
              select: { users: true },
            },
          },
        });

        const employeeCount = dept?._count.users || data.employeeIds.size;
        const avgDaysPerEmployee =
          employeeCount > 0 ? data.totalDays / employeeCount : 0;

        // Calculate utilization rate (assuming 30 days entitlement per year)
        const annualEntitlement = 30;
        const monthsInPeriod = monthsBack;
        const expectedDays = (annualEntitlement / 12) * monthsInPeriod * employeeCount;
        const utilizationRate =
          expectedDays > 0 ? (data.totalDays / expectedDays) * 100 : 0;

        return {
          department,
          employeeCount,
          totalDays: data.totalDays,
          avgDaysPerEmployee,
          utilizationRate: Math.min(utilizationRate, 100),
        };
      })
    );

    // Calculate summary stats
    const totalDays = leaves.reduce((sum, leave) => sum + leave.workingDays, 0);
    const approvedLeaves = leaves.filter(
      (l) => l.status === LeaveRequestStatus.APPROVED
    ).length;
    const approvalRate = totalLeaves > 0 ? (approvedLeaves / totalLeaves) * 100 : 0;

    return NextResponse.json({
      monthlyTrend,
      leaveTypeBreakdown,
      departmentUtilization: departmentUtilization.sort(
        (a, b) => b.totalDays - a.totalDays
      ),
      totalLeaves,
      totalDays,
      approvalRate: Math.round(approvalRate),
      period,
      startDate,
      endDate: now,
    });
  } catch (error) {
    console.error("[ANALYTICS_API_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
