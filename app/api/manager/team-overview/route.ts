import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEPT_HEAD") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Get all team members (users where deptHeadId matches current user)
  const teamMembers = await prisma.user.findMany({
    where: {
      deptHeadId: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const totalEmployees = teamMembers.length;

  // Get today's date in Dhaka timezone
  const today = normalizeToDhakaMidnight(new Date());

  // Find employees on leave today
  const onLeaveToday = await prisma.leaveRequest.count({
    where: {
      requesterId: { in: teamMembers.map((m) => m.id) },
      status: "APPROVED",
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });

  // Get approved leaves from last 90 days for statistics
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const allTeamLeaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: { in: teamMembers.map((m) => m.id) },
      status: "APPROVED",
      updatedAt: { gte: ninetyDaysAgo }, // Only last 90 days
    },
    select: {
      type: true,
      createdAt: true,
      updatedAt: true,
      approvals: {
        where: {
          approverId: user.id,
        },
        orderBy: { step: "asc" },
        take: 1,
        select: {
          decidedAt: true,
        },
      },
    },
  });

  // Calculate top leave type (from last 90 days)
  const typeCounts: Record<string, number> = {};
  allTeamLeaves.forEach((leave) => {
    typeCounts[leave.type] = (typeCounts[leave.type] || 0) + 1;
  });
  const topLeaveType =
    Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

  // Calculate average approval time (time from request creation to approval completion)
  // Use updatedAt - createdAt for approved requests (more accurate than approval step timing)
  const approvalTimes: number[] = [];
  allTeamLeaves.forEach((leave) => {
    const timeDiff = leave.updatedAt.getTime() - leave.createdAt.getTime();
    const days = Math.max(0, timeDiff / (1000 * 60 * 60 * 24)); // Convert to days, ensure non-negative
    if (days > 0) {
      approvalTimes.push(days);
    }
  });
  const avgApprovalTime =
    approvalTimes.length > 0
      ? Number((approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length).toFixed(1))
      : 0;

  // Get upcoming leaves (next 3, deduplicated by employee + startDate)
  const upcomingLeaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: { in: teamMembers.map((m) => m.id) },
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { gte: today },
    },
    include: {
      requester: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  // Deduplicate by requesterId + startDate
  const uniqueUpcoming = Array.from(
    new Map(
      upcomingLeaves.map((leave) => [
        `${leave.requesterId}-${leave.startDate.toISOString().split("T")[0]}`,
        leave,
      ])
    ).values()
  ).slice(0, 3);

  return NextResponse.json({
    totalEmployees,
    onLeaveToday,
    topLeaveType,
    avgApprovalTime,
    upcomingLeaves: uniqueUpcoming.map((leave) => ({
      id: leave.id,
      employeeName: leave.requester.name,
      type: leave.type,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
    })),
  });
}

