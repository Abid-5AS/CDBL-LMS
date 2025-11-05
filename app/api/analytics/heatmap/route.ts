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
  const scope = searchParams.get("scope") || "me"; // default: me
  const range = searchParams.get("range") || "year"; // default: year
  const typesParam = searchParams.get("types");
  const statusParam = searchParams.get("status") || "APPROVED"; // default: APPROVED

  // Parse types filter
  const types = typesParam && typesParam !== "all" 
    ? typesParam.split(",").filter(Boolean)
    : null; // null means all types

  // Parse status filter
  const statusFilter = statusParam === "ALL" 
    ? undefined // undefined means all statuses
    : statusParam === "PENDING"
    ? ["PENDING", "SUBMITTED"]
    : [statusParam];

  // Determine date range
  const today = normalizeToDhakaMidnight(new Date());
  const year = today.getFullYear();
  let periodStart: Date;
  let periodEnd: Date;

  if (range === "rolling12") {
    // Rolling 12 months: from 12 months ago to today
    periodStart = new Date(today);
    periodStart.setMonth(periodStart.getMonth() - 12);
    periodEnd = today;
  } else {
    // Full calendar year: Jan 1 to Dec 31
    periodStart = normalizeToDhakaMidnight(new Date(year, 0, 1));
    periodEnd = normalizeToDhakaMidnight(new Date(year, 11, 31));
  }

  // Determine user IDs to query
  let requesterIds: number[] = [];

  if (scope === "me") {
    requesterIds = [me.id];
  } else {
    // scope === "team": All team members (same deptHeadId)
    const currentUser = await prisma.user.findUnique({
      where: { id: me.id },
      select: { deptHeadId: true },
    });

    if (!currentUser?.deptHeadId) {
      // No team, return empty
      return NextResponse.json({
        periodStart: periodStart.toISOString().slice(0, 10),
        periodEnd: periodEnd.toISOString().slice(0, 10),
        buckets: [],
      });
    }

    const teamMembers = await prisma.user.findMany({
      where: { deptHeadId: currentUser.deptHeadId },
      select: { id: true },
    });

    requesterIds = teamMembers.map((m) => m.id);
  }

  if (requesterIds.length === 0) {
    return NextResponse.json({
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      buckets: [],
    });
  }

  // Build where clause
  const whereClause: any = {
    requesterId: { in: requesterIds },
    startDate: { lte: periodEnd },
    endDate: { gte: periodStart },
  };

  if (types) {
    whereClause.type = { in: types };
  }

  if (statusFilter) {
    whereClause.status = { in: statusFilter };
  }

  // Fetch leave requests
  const leaves = await prisma.leaveRequest.findMany({
    where: whereClause,
    select: {
      type: true,
      startDate: true,
      endDate: true,
    },
  });

  // Create date buckets: map each date to count and types
  const bucketMap = new Map<string, { count: number; types: Set<string> }>();

  // Initialize all dates in range to 0
  const currentDate = new Date(periodStart);
  while (currentDate <= periodEnd) {
    const dateKey = normalizeToDhakaMidnight(currentDate).toISOString().slice(0, 10);
    bucketMap.set(dateKey, { count: 0, types: new Set() });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Process each leave request
  for (const leave of leaves) {
    const leaveStart = normalizeToDhakaMidnight(leave.startDate);
    const leaveEnd = normalizeToDhakaMidnight(leave.endDate);
    const currentDate = new Date(leaveStart);

    // Mark each day in the leave range
    while (currentDate <= leaveEnd) {
      const dateKey = normalizeToDhakaMidnight(currentDate).toISOString().slice(0, 10);
      const bucket = bucketMap.get(dateKey);
      if (bucket) {
        bucket.count += 1;
        bucket.types.add(leave.type);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Convert map to array of buckets (only include dates with count > 0)
  const buckets = Array.from(bucketMap.entries())
    .filter(([_, value]) => value.count > 0)
    .map(([date, value]) => ({
      date,
      count: value.count,
      types: Array.from(value.types),
    }));

  return NextResponse.json({
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    buckets,
  });
}


