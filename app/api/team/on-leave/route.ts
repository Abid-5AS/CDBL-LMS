import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

export const cache = "no-store";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Get query parameters
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const scope = searchParams.get("scope") || "team"; // default: team

  let targetStart: Date;
  let targetEnd: Date;

  if (startDateParam && endDateParam) {
    targetStart = normalizeToDhakaMidnight(new Date(startDateParam));
    targetEnd = normalizeToDhakaMidnight(new Date(endDateParam));
  } else if (dateParam) {
    targetStart = normalizeToDhakaMidnight(new Date(dateParam));
    targetEnd = targetStart;
  } else {
    // Default to today
    targetStart = normalizeToDhakaMidnight(new Date());
    targetEnd = targetStart;
  }

  let memberIds: number[] = [];
  let teamMembers: Array<{ id: number; name: string; email: string; empCode: string | null }> = [];

  if (scope === "me") {
    // User's own leaves
    memberIds = [me.id];
    teamMembers = [{
      id: me.id,
      name: me.name,
      email: me.email,
      empCode: me.empCode,
    }];
  } else {
    // scope === "team": All team members (same deptHeadId) excluding self
    const currentUser = await prisma.user.findUnique({
      where: { id: me.id },
      select: { deptHeadId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // If user has no deptHeadId, they have no team (return empty)
    if (!currentUser.deptHeadId) {
      return NextResponse.json({
        date: targetStart.toISOString().slice(0, 10),
        count: 0,
        members: [],
        days: []
      });
    }

    // Find all team members (users with same deptHeadId)
    // If manager, find their direct reports. If employee, find peers.
    // Assuming simplistic "same deptHeadId" logic for now.
    teamMembers = await prisma.user.findMany({
      where: {
        deptHeadId: currentUser.deptHeadId,
        id: { not: me.id }, // Exclude current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        empCode: true,
      },
    });

    memberIds = teamMembers.map((m) => m.id);
  }

  if (memberIds.length === 0) {
    return NextResponse.json({
      date: targetStart.toISOString().slice(0, 10),
      count: 0,
      members: [],
      days: []
    });
  }

  // Find approved leaves overlapping the target range
  // Logic: Leave Start <= Range End AND Leave End >= Range Start
  const leavesOnLeave = await prisma.leaveRequest.findMany({
    where: {
      requesterId: { in: memberIds },
      status: "APPROVED",
      startDate: { lte: targetEnd },
      endDate: { gte: targetStart },
    },
    select: {
      id: true,
      requesterId: true,
      type: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { startDate: "asc" },
  });

  // Helper to map leave to member details
  const mapLeaveToMember = (leave: any) => {
    const member = teamMembers.find((m) => m.id === leave.requesterId);
    if (!member) return null;
    return {
      id: member.id,
      name: member.name,
      avatar: `/u/${member.id}.png`,
      type: leave.type,
      leaveType: leave.type,
      start: leave.startDate.toISOString().slice(0, 10),
      end: leave.endDate.toISOString().slice(0, 10),
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      employeeName: member.name,
    };
  };

  // If single day request (original compatibility)
  if (!startDateParam || !endDateParam) {
    const members = leavesOnLeave.map(mapLeaveToMember).filter((c): c is NonNullable<typeof c> => c !== null);
    return NextResponse.json({
      date: targetStart.toISOString().slice(0, 10),
      count: members.length,
      members,
    });
  }

  // Range request - grouping by date
  // We need to iterate through each day in the range and check which leaves cover it
  const days: Record<string, { count: number; members: any[] }> = {};
  
  const currentCursor = new Date(targetStart);
  // Loop through each day
  while (currentCursor <= targetEnd) {
    const dateStr = currentCursor.toISOString().slice(0, 10); // YYYY-MM-DD
    
    // Find leaves active on this specific day
    const activeLeaves = leavesOnLeave.filter(leave => {
       const start = new Date(leave.startDate);
       const end = new Date(leave.endDate);
       // Normalize overlap check
       return start <= currentCursor && end >= currentCursor;
    });

    const membersOnLeave = activeLeaves.map(mapLeaveToMember).filter((c): c is NonNullable<typeof c> => c !== null);

    days[dateStr] = {
      count: membersOnLeave.length,
      members: membersOnLeave
    };

    // Next day
    currentCursor.setDate(currentCursor.getDate() + 1);
  }

  return NextResponse.json({
    range: {
      start: targetStart.toISOString().slice(0, 10),
      end: targetEnd.toISOString().slice(0, 10)
    },
    days // Map of YYYY-MM-DD -> { count, members }
  });
}
