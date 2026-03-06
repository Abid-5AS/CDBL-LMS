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
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Parallel queries
    const [
      pendingApprovals,
      teamsHeadOf,
      teamsInDept
    ] = await Promise.all([
      // 1. Pending Approvals
      prisma.approval.count({
        where: {
          approverId: user.id,
          decision: "PENDING",
        },
      }),

      // 2. Team Counts
      // Definition of team: Users who report to this user (deptHeadId)
      // OR users in the same department (if simple manager view without hierarchy enforcement)
      // Strict hierarchy:
      prisma.user.findMany({
        where: {
          deptHeadId: user.id,
        },
        select: {
          id: true,
        },
      }),
      // Fallback: Same department if not a dept head explicitly?
      // For now, let's rely on deptHeadId as per "Manager" role implies hierarchy.
      // But if count is 0, maybe check department match?
      // Let's stick strict first.
      Promise.resolve([]), 
    ]);

    let teamIds = teamsHeadOf.map(u => u.id);

    // If no direct reports, maybe they manage the whole department?
    if (teamIds.length === 0 && user.department) {
       // Optional: logic to fetch all in department if Role is DEPT_HEAD but no direct link
       // checking role...
       if (user.role === 'DEPT_HEAD') {
          const deptMembers = await prisma.user.findMany({
            where: {
                department: user.department,
                id: { not: user.id } // Exclude self
            },
            select: { id: true }
          });
          teamIds = deptMembers.map(u => u.id);
       }
    }

    let teamAvailability = 100.0;
    
    if (teamIds.length > 0) {
        // Count how many are on leave today
        const teamOnLeave = await prisma.leaveRequest.count({
            where: {
                requesterId: {
                    in: teamIds
                },
                status: "APPROVED",
                startDate: { lte: endOfToday },
                endDate: { gte: startOfToday }
            }
        });

        const present = teamIds.length - teamOnLeave;
        teamAvailability = (present / teamIds.length) * 100;
    }

    return NextResponse.json({
      pendingApprovals,
      teamAvailability: Math.round(teamAvailability * 10) / 10
    });

  } catch (error) {
    console.error("Error fetching Manager Dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch manager data" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
