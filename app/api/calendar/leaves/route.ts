import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus, LeaveType } from "@prisma/client";

/**
 * GET /api/calendar/leaves
 *
 * Returns leave events for calendar display
 *
 * Query params:
 * - month: number (0-11)
 * - year: number
 * - view: "my" | "team" | "department" | "all"
 * - type: LeaveType (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const view = searchParams.get("view") || "my";
    const typeFilter = searchParams.get("type") as LeaveType | null;

    // Calculate date range for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Build where clause based on view
    let whereClause: any = {
      status: {
        in: [LeaveStatus.APPROVED, LeaveStatus.SUBMITTED],
      },
      OR: [
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ],
    };

    // Apply view filter
    if (view === "my") {
      whereClause.requesterId = user.id;
    } else if (view === "team" && user.department) {
      // Get department members
      whereClause.requester = {
        department: user.department,
      };
    } else if (view === "department" && user.department) {
      whereClause.requester = {
        department: user.department,
      };
    }
    // "all" view - only for admin roles
    else if (view === "all") {
      if (!["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
      // No additional filter - all leaves
    }

    // Apply type filter
    if (typeFilter) {
      whereClause.type = typeFilter;
    }

    // Fetch leaves
    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        requester: {
          select: {
            name: true,
            empCode: true,
            department: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    // Transform to calendar events
    const events = leaves.map((leave) => ({
      id: leave.id,
      employeeName: leave.requester.name,
      employeeCode: leave.requester.empCode,
      department: leave.requester.department || "N/A",
      leaveType: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      status: leave.status,
      workingDays: leave.workingDays,
    }));

    return NextResponse.json({
      events,
      month,
      year,
      view,
      totalEvents: events.length,
    });
  } catch (error) {
    console.error("[CALENDAR_LEAVES_API_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
