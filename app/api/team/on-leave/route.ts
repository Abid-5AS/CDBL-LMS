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
  const scope = searchParams.get("scope") || "team"; // default: team
  const targetDate = dateParam
    ? normalizeToDhakaMidnight(new Date(dateParam))
    : normalizeToDhakaMidnight(new Date());

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
        date: dateParam || new Date().toISOString().slice(0, 10),
        count: 0,
        members: [],
      });
    }

    // Find all team members (users with same deptHeadId)
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
      date: dateParam || new Date().toISOString().slice(0, 10),
      count: 0,
      members: [],
    });
  }

  // Find approved leaves where target date falls within startDate and endDate
  const leavesOnLeave = await prisma.leaveRequest.findMany({
    where: {
      requesterId: { in: memberIds },
      status: "APPROVED",
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
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

  // Map leaves to members with their details
  const members = leavesOnLeave.map((leave) => {
    const member = teamMembers.find((m) => m.id === leave.requesterId);
    if (!member) return null;

    return {
      id: member.id,
      name: member.name,
      avatar: `/u/${member.id}.png`, // Placeholder avatar path
      type: leave.type,
      start: leave.startDate.toISOString().slice(0, 10),
      end: leave.endDate.toISOString().slice(0, 10),
    };
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  return NextResponse.json({
    date: dateParam || new Date().toISOString().slice(0, 10),
    count: members.length,
    members,
  });
}
