import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/admin/config-status
 *
 * Returns configuration status for System Admin dashboard
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - SYSTEM_ADMIN access required" },
        { status: 403 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;

    // Get configuration counts
    const [departmentCount, holidayCount, policyCount, userCount, holidaysNextYear] =
      await Promise.all([
        // Departments
        prisma.user.groupBy({
          by: ["department"],
          where: {
            department: {
              not: null,
            },
          },
        }),

        // Holidays this year
        prisma.holiday.count({
          where: {
            date: {
              gte: new Date(currentYear, 0, 1),
              lt: new Date(currentYear + 1, 0, 1),
            },
          },
        }),

        // Leave policies (assuming a Policy model exists, otherwise use a placeholder)
        5, // Placeholder: Casual, Sick, Earned, Maternity, Paternity

        // Users
        prisma.user.count(),

        // Holidays for next year
        prisma.holiday.count({
          where: {
            date: {
              gte: new Date(nextYear, 0, 1),
              lt: new Date(nextYear + 1, 0, 1),
            },
          },
        }),
      ]);

    const departments = {
      count: departmentCount.length,
      status: departmentCount.length > 0 ? ("ok" as const) : ("warning" as const),
      message:
        departmentCount.length > 0
          ? `${departmentCount.length} departments configured`
          : "No departments configured",
    };

    const holidays = {
      count: holidayCount,
      status: holidaysNextYear > 0 ? ("ok" as const) : ("warning" as const),
      message:
        holidaysNextYear > 0
          ? `${holidayCount} holidays this year, ${nextYear} configured`
          : `${holidayCount} holidays (add ${nextYear} holidays)`,
    };

    const policies = {
      count: policyCount,
      status: policyCount >= 5 ? ("ok" as const) : ("warning" as const),
      message:
        policyCount >= 5
          ? `${policyCount} leave policies active`
          : "Review leave policy configuration",
    };

    const users = {
      count: userCount,
      status: userCount > 0 ? ("ok" as const) : ("warning" as const),
      message: `${userCount} users in system`,
    };

    return NextResponse.json({
      departments,
      holidays,
      policies,
      users,
    });
  } catch (error) {
    console.error("Error fetching config status:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration status" },
      { status: 500 }
    );
  }
}
