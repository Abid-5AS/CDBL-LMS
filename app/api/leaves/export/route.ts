import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * Export leave requests as CSV
 * GET /api/leaves/export
 * Query params: status, type, startDate, endDate, etc.
 */
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    // Role-based visibility
    if (user.role === "EMPLOYEE") {
      where.requesterId = user.id;
    } else if (user.role === "DEPT_HEAD") {
      // Dept Head sees their team members
      const teamMembers = await prisma.user.findMany({
        where: { department: user.department },
        select: { id: true },
      });
      where.requesterId = { in: teamMembers.map((u) => u.id) };
    }
    // HR_ADMIN, HR_HEAD, CEO see all

    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            name: true,
            email: true,
            empCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV
    const headers = [
      "ID",
      "Employee Name",
      "Email",
      "Employee Code",
      "Type",
      "Start Date",
      "End Date",
      "Working Days",
      "Status",
      "Reason",
      "Created At",
    ];

    const rows = leaves.map((leave) => [
      leave.id.toString(),
      leave.requester.name,
      leave.requester.email,
      leave.requester.empCode || "",
      leave.type,
      leave.startDate.toISOString().split("T")[0],
      leave.endDate.toISOString().split("T")[0],
      leave.workingDays.toString(),
      leave.status,
      leave.reason.replace(/"/g, '""'), // Escape quotes for CSV
      leave.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leaves-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      error("export_failed", "Failed to export leaves", traceId),
      { status: 500 }
    );
  }
}

