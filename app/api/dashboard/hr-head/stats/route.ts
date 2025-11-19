import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/dashboard/hr-head/stats
 *
 * Returns comprehensive statistics for HR_HEAD dashboard
 * - Pending requests count
 * - Employees on leave today
 * - Returned requests count
 * - Upcoming leaves count
 * - Total requests this month
 * - New hires this month
 * - Average casual leave usage
 * - Organization-wide metrics
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

    // Verify HR_HEAD role
    if (user.role !== "HR_HEAD") {
      return NextResponse.json(
        { error: "Forbidden - HR_HEAD access required" },
        { status: 403 }
      );
    }

    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Parallel queries for better performance
    const [
      pendingCount,
      onLeaveToday,
      returnedCount,
      upcomingCount,
      monthlyRequests,
      newHires,
      casualLeaveStats,
      totalEmployees,
      approvalStats,
    ] = await Promise.all([
      // Fixed: Count only approvals pending for this specific user
      prisma.approval.count({
        where: {
          approverId: user.id,
          decision: "PENDING",
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

      // Returned requests
      prisma.leaveRequest.count({
        where: {
          status: "RETURNED",
        },
      }),

      // Upcoming leaves (next 7 days)
      prisma.leaveRequest.count({
        where: {
          status: "APPROVED",
          startDate: {
            gte: tomorrow,
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total requests this month
      prisma.leaveRequest.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
            lt: firstDayOfNextMonth,
          },
        },
      }),

      // New hires this month
      prisma.user.count({
        where: {
          role: "EMPLOYEE",
          createdAt: {
            gte: firstDayOfMonth,
            lt: firstDayOfNextMonth,
          },
        },
      }),

      // Casual leave statistics (this year)
      prisma.leaveRequest.aggregate({
        where: {
          type: "CASUAL",
          status: "APPROVED",
          startDate: {
            gte: new Date(now.getFullYear(), 0, 1),
          },
        },
        _avg: {
          workingDays: true,
        },
        _count: {
          id: true,
        },
      }),

      // Total employees
      prisma.user.count({
        where: {
          role: {
            in: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD"],
          },
        },
      }),

      // Approval statistics (this month)
      prisma.approval.findMany({
        where: {
          decidedAt: {
            gte: firstDayOfMonth,
            lt: firstDayOfNextMonth,
          },
          decision: {
            in: ["APPROVED", "REJECTED"],
          },
        },
        include: {
          leave: {
            select: {
              createdAt: true,
            },
          },
        },
      }),
    ]);

    // Calculate average casual leave days
    const avgCasualDays =
      casualLeaveStats._count.id > 0
        ? casualLeaveStats._avg.workingDays || 0
        : 0;

    // Get recent activity (last 5 actions)
    const recentActivity = await prisma.approval.findMany({
      where: {
        decision: {
          not: "PENDING",
        },
      },
      orderBy: {
        decidedAt: "desc",
      },
      take: 5,
      include: {
        approver: {
          select: {
            name: true,
            role: true,
          },
        },
        leave: {
          select: {
            type: true,
            requester: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get department-wise breakdown
    const departmentStats = await prisma.user.groupBy({
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
    });

    // Get department-wise performance metrics
    const departmentPerformance = await Promise.all(
      departmentStats.map(async (dept) => {
        const deptName = dept.department || "Unassigned";

        // Get pending requests for this department
        const pendingInDept = await prisma.leaveRequest.count({
          where: {
            status: "PENDING",
            requester: {
              department: dept.department,
            },
          },
        });

        // Get employees on leave in this department
        const onLeaveInDept = await prisma.leaveRequest.count({
          where: {
            status: "APPROVED",
            startDate: { lte: tomorrow },
            endDate: { gte: today },
            requester: {
              department: dept.department,
            },
          },
        });

        // Get approval time stats for this department (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deptApprovals = await prisma.approval.findMany({
          where: {
            decidedAt: {
              gte: thirtyDaysAgo,
            },
            decision: {
              in: ["APPROVED", "REJECTED"],
            },
            leave: {
              requester: {
                department: dept.department,
              },
            },
          },
          include: {
            leave: {
              select: {
                createdAt: true,
              },
            },
          },
        });

        const avgApprovalTime = deptApprovals.length > 0
          ? deptApprovals.reduce((sum, approval) => {
              const createdAt = new Date(approval.leave.createdAt);
              const decidedAt = new Date(approval.decidedAt!);
              const diffInDays = (decidedAt.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
              return sum + diffInDays;
            }, 0) / deptApprovals.length
          : 0;

        return {
          name: deptName,
          employees: dept._count.id,
          pending: pendingInDept,
          onLeave: onLeaveInDept,
          avgApprovalTime: Number(avgApprovalTime.toFixed(1)),
        };
      })
    );

    // Get escalated cases (requests that required HR_HEAD approval)
    const escalatedCasesRaw = await prisma.approval.findMany({
      where: {
        approverId: user.id,
        decision: "PENDING",
        leave: {
          status: "PENDING",
        },
      },
      take: 10,
      include: {
        leave: {
          include: {
            requester: {
              select: {
                name: true,
                department: true,
              },
            },
          },
        },
      },
    });

    // Calculate compliance score based on on-time processing
    const totalProcessed = approvalStats.length;
    const onTimeApprovals = approvalStats.filter((approval) => {
      const createdAt = new Date(approval.leave.createdAt);
      const decidedAt = new Date(approval.decidedAt!);
      const diffInDays = (decidedAt.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
      return diffInDays <= 3;
    }).length;

    const complianceScore = totalProcessed > 0
      ? Math.round((onTimeApprovals / totalProcessed) * 100)
      : 100;

    const stats = {
      // Core KPIs
      pending: pendingCount,
      onLeave: onLeaveToday,
      returned: returnedCount,
      upcoming: upcomingCount,

      // Monthly metrics
      monthlyRequests: monthlyRequests,
      newHires: newHires,
      avgCasualDays: Number(avgCasualDays.toFixed(1)),

      // Organization metrics
      totalEmployees,
      processedThisMonth: totalProcessed,
      complianceScore,

      // Recent activity
      recentActivity: recentActivity.map((approval) => ({
        id: approval.id,
        action: approval.decision,
        approver: approval.approver.name,
        approverRole: approval.approver.role,
        employee: approval.leave.requester.name,
        leaveType: approval.leave.type,
        decidedAt: approval.decidedAt,
      })),

      // Department breakdown
      departments: departmentStats.map((dept) => ({
        name: dept.department || "Unassigned",
        employees: dept._count.id,
      })),

      // Department performance analytics
      departmentPerformance,

      // Escalated cases
      escalatedCases: escalatedCasesRaw.map((approval: any) => ({
        id: approval.id,
        leaveId: approval.leaveId,
        employeeName: approval.leave.requester.name,
        department: approval.leave.requester.department || "Unassigned",
        leaveType: approval.leave.type,
        startDate: approval.leave.startDate,
        endDate: approval.leave.endDate,
        workingDays: approval.leave.workingDays,
        reason: approval.leave.reason,
        submittedAt: approval.leave.createdAt,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching HR_HEAD stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
