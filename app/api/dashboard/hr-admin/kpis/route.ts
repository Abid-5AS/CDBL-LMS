import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/dashboard/hr-admin/kpis
 *
 * Fast endpoint returning only critical KPI data
 * Should return in < 100ms for instant card rendering
 * Does not include charts or analytics data
 */
export async function GET(req: NextRequest) {
  // Check cache first
  const cacheKey = "hr-admin-kpis";
  const cachedData = await prisma.$queryRaw`
    SELECT JSON_EXTRACT(details, '$') as data
    FROM "AuditLog"
    WHERE action = ${cacheKey}
    AND createdAt > datetime('now', '-1 minute')
    LIMIT 1
  `.catch(() => null);

  if (cachedData) {
    return NextResponse.json(cachedData[0], {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
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

    // CRITICAL KPI queries only - count operations are extremely fast
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

    // Daily target and progress
    const dailyTarget = 10;
    const dailyProgress = Math.min(
      Math.round((processedToday / dailyTarget) * 100),
      100
    );

    const kpiData = {
      // Core KPIs
      employeesOnLeave,
      pendingRequests,
      avgApprovalTime: 2.5, // Placeholder - compute separately if needed
      encashmentPending: 0,

      // Volume metrics
      totalLeavesThisYear,
      processedToday,
      dailyTarget,
      dailyProgress,

      // Performance metrics
      teamUtilization: 85, // Placeholder
      complianceScore: 94, // Placeholder

      // Analytics data (empty - will be fetched separately)
      leaveTypeBreakdown: [],
      monthlyTrend: [],
    };

    return NextResponse.json(kpiData, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching HR_ADMIN KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 }
    );
  }
}
