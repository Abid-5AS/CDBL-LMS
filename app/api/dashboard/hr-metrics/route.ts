import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus, Role } from "@prisma/client";

export const cache = "no-store";

/**
 * GET /api/dashboard/hr-metrics
 * Returns department-level metrics for HR Admin dashboard
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Only HR_ADMIN can access
  if (user.role !== "HR_ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [
      departmentHeadcount,
      employeesOnLeaveToday,
      pendingRequests,
      cancellationRequests,
    ] = await Promise.all([
      // Total employees in system
      prisma.user.count({
        where: { role: Role.EMPLOYEE },
      }),
      // Employees on leave today
      prisma.leaveRequest.count({
        where: {
          status: LeaveStatus.APPROVED,
          startDate: { lte: today },
          endDate: { gte: today },
        },
        distinct: ["requesterId"],
      }),
      // Pending leave requests
      prisma.leaveRequest.count({
        where: {
          status: { in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING] },
        },
      }),
      // Cancellation requests
      prisma.leaveRequest.count({
        where: {
          status: LeaveStatus.CANCELLATION_REQUESTED,
        },
      }),
    ]);

    return NextResponse.json({
      departmentHeadcount,
      employeesOnLeaveToday,
      pendingRequests,
      cancellationRequests,
    });
  } catch (error) {
    console.error("Error fetching HR metrics:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}



