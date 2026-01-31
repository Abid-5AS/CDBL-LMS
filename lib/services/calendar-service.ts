import { prisma } from "@/lib/prisma";
import { LeaveStatus, LeaveType } from "@/src/generated/prisma/client";

export type CalendarViewType = "my" | "team" | "department" | "all";

export interface GetCalendarEventsParams {
  userId: string;
  userRole: string;
  userDepartment?: string | null;
  month: number;
  year: number;
  view: CalendarViewType;
  typeFilter?: LeaveType | null;
}

export async function getCalendarEvents({
  userId,
  userRole,
  userDepartment,
  month,
  year,
  view,
  typeFilter,
}: GetCalendarEventsParams) {
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
    whereClause.requesterId = userId;
  } else if (view === "team" && userDepartment) {
    // Get department members
    whereClause.requester = {
      department: userDepartment,
    };
  } else if (view === "department" && userDepartment) {
    whereClause.requester = {
      department: userDepartment,
    };
  }
  // "all" view - only for admin roles
  else if (view === "all") {
    if (!["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(userRole)) {
      throw new Error("Forbidden - Admin access required");
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

  return {
    events,
    month,
    year,
    view,
    totalEvents: events.length,
  };
}
