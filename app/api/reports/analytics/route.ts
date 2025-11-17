import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

type Duration = "month" | "quarter" | "year";

function getDateRange(duration: Duration): { start: Date; end: Date } {
  const today = normalizeToDhakaMidnight(new Date());
  const year = today.getFullYear();
  const month = today.getMonth();

  switch (duration) {
    case "month":
      return {
        start: normalizeToDhakaMidnight(new Date(year, month, 1)),
        end: normalizeToDhakaMidnight(new Date(year, month + 1, 0)),
      };
    case "quarter":
      const quarterStartMonth = Math.floor(month / 3) * 3;
      return {
        start: normalizeToDhakaMidnight(new Date(year, quarterStartMonth, 1)),
        end: normalizeToDhakaMidnight(new Date(year, quarterStartMonth + 3, 0)),
      };
    case "year":
      return {
        start: normalizeToDhakaMidnight(new Date(year, 0, 1)),
        end: normalizeToDhakaMidnight(new Date(year, 11, 31)),
      };
  }
}

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
    }

    // Only HR_ADMIN, HR_HEAD, and SYSTEM_ADMIN can access
    const allowedRoles = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(error("forbidden", "Access denied", traceId), { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const duration = (searchParams.get("duration") || "month") as Duration;
    const departmentIdParam = searchParams.get("department");
    const leaveTypeParam = searchParams.get("leaveType");
    
    // Handle "all" values - convert to null
    const departmentId = departmentIdParam && departmentIdParam !== "all" ? departmentIdParam : null;
    const leaveType = leaveTypeParam && leaveTypeParam !== "all" ? leaveTypeParam : null;

    const { start, end } = getDateRange(duration);

    // Build where clause
    const whereClause: any = {
      status: {
        in: ["APPROVED", "PENDING", "SUBMITTED"],
      },
      startDate: {
        gte: start,
        lte: end,
      },
    };

    if (departmentId) {
      // Get all unique departments and match by index (since department is stored as string in User)
      const allDeptUsers = await prisma.user.findMany({
        where: {
          department: {
            not: null,
          },
        },
        select: {
          department: true,
        },
        distinct: ["department"],
        orderBy: {
          department: "asc",
        },
      });
      
      const deptIndex = Number(departmentId) - 1;
      if (deptIndex >= 0 && deptIndex < allDeptUsers.length) {
        const deptName = allDeptUsers[deptIndex].department;
        if (deptName) {
          whereClause.requester = { department: deptName };
        }
      }
    }

    if (leaveType) {
      whereClause.type = leaveType;
    }

    // Get leave requests - use select instead of include to avoid SelectionSetOnScalar error
    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        workingDays: true,
        status: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true, // This is a string field, not a relation
          },
        },
        approvals: {
          select: {
            decidedAt: true,
            step: true,
          },
          orderBy: {
            step: "asc",
          },
        },
      },
    });
    const rangeLabel = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    const hasMatchingLeaves = leaves.length > 0;
    const emptyState = hasMatchingLeaves
      ? null
      : {
          title:
            departmentId || leaveType
              ? "No requests for this filter combination"
              : "No leave activity for the selected period",
          description:
            departmentId || leaveType
              ? "Try widening the department, leave type, or time range filters to see results."
              : `We did not record any leave requests between ${rangeLabel}.`,
        };

    // Calculate KPIs
    const pendingCount = leaves.filter((l) => ["PENDING", "SUBMITTED"].includes(l.status)).length;
    const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
    
    // Calculate average approval time (in days)
    const approvedLeaves = leaves.filter((l) => l.status === "APPROVED" && l.approvals.length > 0);
    const approvalTimes = approvedLeaves.map((leave) => {
      const firstApproval = leave.approvals[0];
      const lastApproval = leave.approvals[leave.approvals.length - 1];
      if (firstApproval && lastApproval && lastApproval.decidedAt) {
        const diff = lastApproval.decidedAt.getTime() - new Date(leave.startDate).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
      return 0;
    }).filter((t) => t > 0);
    const avgApprovalTime = approvalTimes.length > 0
      ? Math.round(approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length)
      : 0;

    // Get total employees
    const totalEmployees = await prisma.user.count({
      where: {
        role: "EMPLOYEE",
      },
    });

    // Calculate leave utilization rate
    const totalWorkingDays = leaves
      .filter((l) => l.status === "APPROVED")
      .reduce((sum, l) => sum + (l.workingDays || 0), 0);
    // Assuming average entitlement per employee (this is a simplified calculation)
    const avgEntitlementPerEmployee = 30; // Approximate
    const totalEntitlement = totalEmployees * avgEntitlementPerEmployee;
    const utilizationRate = totalEntitlement > 0
      ? Math.round((totalWorkingDays / totalEntitlement) * 100)
      : 0;

    // Monthly trend data (for current year) - use separate query without filters
    const yearStart = normalizeToDhakaMidnight(new Date(new Date().getFullYear(), 0, 1));
    const yearEnd = normalizeToDhakaMidnight(new Date(new Date().getFullYear(), 11, 31));
    
    const yearLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      select: {
        startDate: true,
        workingDays: true,
      },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrend = monthNames.map((month, index) => {
      const monthLeaves = yearLeaves.filter((l) => {
        const leaveMonth = new Date(l.startDate).getMonth();
        return leaveMonth === index;
      });
      return {
        month,
        leaves: monthLeaves.reduce((sum, l) => sum + (l.workingDays || 0), 0),
      };
    });

    // Leave type distribution
    const typeDistribution = leaves
      .filter((l) => l.status === "APPROVED")
      .reduce((acc, leave) => {
        const type = leave.type;
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type] += leave.workingDays || 0;
        return acc;
      }, {} as Record<string, number>);

    const distributionData = Object.entries(typeDistribution).map(([type, days]) => ({
      name: type,
      value: days,
    }));

    // Department-wise summary
    const deptSummary = leaves
      .filter((l) => l.status === "APPROVED")
      .reduce((acc, leave) => {
        const deptName = leave.requester.department || "Unknown"; // department is a string, not an object
        if (!acc[deptName]) {
          acc[deptName] = 0;
        }
        acc[deptName] += leave.workingDays || 0;
        return acc;
      }, {} as Record<string, number>);

    const departmentData = Object.entries(deptSummary)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 departments

    return NextResponse.json({
      kpis: {
        pendingApprovals: pendingCount,
        approvedLeaves: approvedCount,
        avgApprovalTime,
        totalEmployees,
        utilizationRate,
      },
      charts: {
        monthlyTrend,
        typeDistribution: distributionData,
        departmentSummary: departmentData,
      },
      duration,
      filters: {
        department: departmentId ? Number(departmentId) : null,
        leaveType: leaveType || null,
      },
      emptyState,
    });
  } catch (err) {
    console.error("Analytics API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      error("internal_error", `Failed to load analytics: ${message}`, traceId),
      { status: 500 }
    );
  }
}
