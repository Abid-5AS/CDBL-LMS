import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Parallel queries
    const [
      balances,
      needsAttentionCount,
      underReviewCount,
      nextApprovedLeave,
      activeLeaves
    ] = await Promise.all([
      // 1. Leave Balances
      prisma.balance.findMany({
        where: {
          userId: user.id,
          year: currentYear,
        },
      }),

      // 2. Needs Attention (Returned or Rejected in last 30 days)
      prisma.leaveRequest.count({
        where: {
          requesterId: user.id,
          status: {
            in: ["RETURNED", "REJECTED"],
          },
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 3. Under Review (Pending)
      prisma.leaveRequest.count({
        where: {
          requesterId: user.id,
          status: "PENDING",
        },
      }),

      // 4. Next Approved Leave
      prisma.leaveRequest.findFirst({
        where: {
          requesterId: user.id,
          status: "APPROVED",
          startDate: {
            gt: today,
          },
        },
        orderBy: {
          startDate: "asc",
        },
      }),

      // 5. Who's Out Today (Same logic as whos-out endpoint)
      prisma.leaveRequest.findMany({
        where: {
          status: "APPROVED",
          startDate: {
            lte: endOfToday,
          },
          endDate: {
            gte: startOfToday,
          },
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
      }),
    ]);

    // Transform Balance Array to Object
    const balanceMap: Record<string, number> = {};
    balances.forEach((b) => {
      // Using closing balance as the current available balance
      balanceMap[b.type] = b.closing;
    });

    // Transform Who's Out
    const whosOutList = activeLeaves.map((leave) => ({
      id: leave.requester.id,
      employeeName: leave.requester.name,
      department: leave.requester.department,
      leaveType: leave.type,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
    }));

    return NextResponse.json({
      balance: balanceMap,
      needsAttentionCount,
      underReviewCount,
      nextApprovedLeave,
      whosOutToday: whosOutList,
    });

  } catch (error) {
    console.error("Error fetching Employee Dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
