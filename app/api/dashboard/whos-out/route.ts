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

    const now = new Date();
    // Normalize today to start of day for comparison if needed, 
    // but Prisma date comparison usually works with full Date objects.
    // For "active today", we check: startDate <= now AND endDate >= now
    // Actually, usually we want to cover the whole day.
    // Let's use the exact logic:
    // startDate <= end of today AND endDate >= start of today
    
    // Simple approach: active at this exact moment (server time)
    // Or broader: active at any point today.
    // Let's go with "active today" (overlap with today)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const activeLeaves = await prisma.leaveRequest.findMany({
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
    });

    const whosOutList = activeLeaves.map((leave) => ({
      id: leave.requester.id,
      employeeName: leave.requester.name,
      department: leave.requester.department,
      leaveType: leave.type,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: whosOutList
    });
  } catch (error) {
    console.error("Error fetching Who's Out:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
