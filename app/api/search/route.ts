import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { canViewAllRequests } from "@/lib/rbac";

export const cache = "no-store";

/**
 * Global search endpoint
 * GET /api/search?q=<query>
 * 
 * Searches across:
 * - Leave requests (reason, employee name, type)
 * - Employees (name, email, empCode)
 * - Holidays (name, date)
 * 
 * Respects RBAC - employees see own leaves, HR sees all
 */
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        leaves: [],
        employees: [],
        holidays: [],
      });
    }

    const searchTerm = `%${query}%`;

    // Build where clause for leave requests based on role
    const leaveWhere: any = {
      OR: [
        { reason: { contains: query, mode: "insensitive" as const } },
      ],
    };

    // Role-based visibility for leaves
    if (user.role === "EMPLOYEE") {
      leaveWhere.requesterId = user.id;
    } else if (user.role === "DEPT_HEAD") {
      // Dept Head sees team members
      const teamMembers = await prisma.user.findMany({
        where: { department: user.department },
        select: { id: true },
      });
      leaveWhere.requesterId = { in: teamMembers.map((u) => u.id) };
    }
    // HR_ADMIN, HR_HEAD, CEO see all (no additional filter)

    // Search leave requests
    const leaves = await prisma.leaveRequest.findMany({
      where: leaveWhere,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            empCode: true,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    // Filter leaves by search term (check employee name, type)
    const filteredLeaves = leaves.filter((leave) => {
      const nameMatch = leave.requester.name?.toLowerCase().includes(query.toLowerCase());
      const emailMatch = leave.requester.email?.toLowerCase().includes(query.toLowerCase());
      const empCodeMatch = leave.requester.empCode?.toLowerCase().includes(query.toLowerCase());
      const typeMatch = leave.type.toLowerCase().includes(query.toLowerCase());
      const reasonMatch = leave.reason?.toLowerCase().includes(query.toLowerCase());
      
      return nameMatch || emailMatch || empCodeMatch || typeMatch || reasonMatch;
    });

    // Search employees (role-based visibility)
    let employeesWhere: any = {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
        { empCode: { contains: query, mode: "insensitive" as const } },
      ],
    };

    // Apply role-based visibility for employees
    if (!canViewAllRequests(user.role)) {
      // Employees can only see themselves
      if (user.role === "EMPLOYEE") {
        employeesWhere.id = user.id;
      }
    }

    const employees = await prisma.user.findMany({
      where: employeesWhere,
      select: {
        id: true,
        name: true,
        email: true,
        empCode: true,
        role: true,
        department: true,
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    // Search holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
        ],
      },
      take: 10,
      orderBy: { date: "asc" },
    });

    // Format results for frontend
    const results = {
      leaves: filteredLeaves.map((leave) => ({
        id: leave.id,
        type: "leave" as const,
        title: `${leave.requester.name} - ${leave.type}`,
        subtitle: leave.reason || "",
        url: `/leaves/${leave.id}`,
        metadata: {
          status: leave.status,
          startDate: leave.startDate.toISOString(),
          endDate: leave.endDate.toISOString(),
          employeeName: leave.requester.name,
        },
      })),
      employees: employees.map((emp) => ({
        id: emp.id,
        type: "employee" as const,
        title: emp.name || emp.email,
        subtitle: emp.department || emp.role,
        url: `/employees/${emp.id}`,
        metadata: {
          email: emp.email,
          empCode: emp.empCode,
          role: emp.role,
        },
      })),
      holidays: holidays.map((holiday) => ({
        id: holiday.id,
        type: "holiday" as const,
        title: holiday.name,
        subtitle: holiday.date.toISOString().split("T")[0],
        url: `/holidays`,
        metadata: {
          date: holiday.date.toISOString(),
        },
      })),
    };

    return NextResponse.json(results);
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      error("search_failed", "Search failed. Please try again.", traceId),
      { status: 500 }
    );
  }
}

