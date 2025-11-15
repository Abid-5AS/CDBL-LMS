/**
 * Department-wise Leave Summary Export API
 * Endpoint: GET /api/reports/department-summary
 *
 * Generates comprehensive department-wise leave summary with:
 * - Total leaves by department
 * - Leave type breakdown per department
 * - Employee count per department
 * - Average leave days per employee
 * - Department utilization rates
 *
 * Export formats: CSV, Excel-compatible CSV
 * Access: HR_ADMIN, HR_HEAD, DEPT_HEAD, SYSTEM_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * GET /api/reports/department-summary
 * Query params:
 * - year: number (default: current year)
 * - month: number (1-12, optional - if not provided, shows full year)
 * - format: 'csv' | 'excel-csv' (default: 'excel-csv')
 */
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  // Allow HR roles and Dept Heads
  const allowedRoles = ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD", "SYSTEM_ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      error("forbidden", "Only HR staff and Department Heads can export department summaries", traceId),
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);

  // Parse parameters
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const format = searchParams.get("format") || "excel-csv";

  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
  const month = monthParam ? parseInt(monthParam) : null;

  if (isNaN(year) || (month !== null && (isNaN(month) || month < 1 || month > 12))) {
    return NextResponse.json(
      error("validation_error", "Invalid year or month", traceId),
      { status: 400 }
    );
  }

  // Calculate date range
  let startDate: Date;
  let endDate: Date;

  if (month !== null) {
    // Specific month
    startDate = normalizeToDhakaMidnight(new Date(year, month - 1, 1));
    endDate = normalizeToDhakaMidnight(new Date(year, month, 0));
  } else {
    // Full year
    startDate = normalizeToDhakaMidnight(new Date(year, 0, 1));
    endDate = normalizeToDhakaMidnight(new Date(year, 11, 31));
  }

  try {
    // Get all departments with employee counts
    const departments = await prisma.user.groupBy({
      by: ['department'],
      where: {
        department: { not: null },
        role: 'EMPLOYEE',
      },
      _count: { id: true },
    });

    // Get approved leaves in date range
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { gte: startDate, lte: endDate },
        ...(user.role === "DEPT_HEAD" ? {
          requester: { department: user.department },
        } : {}),
      },
      include: {
        requester: {
          select: {
            department: true,
          },
        },
      },
    });

    // Process data by department
    const departmentSummary: Array<{
      department: string;
      employeeCount: number;
      totalLeaveDays: number;
      avgDaysPerEmployee: number;
      leavesByType: Record<string, number>;
      utilizationRate: number;
    }> = [];

    for (const dept of departments) {
      const deptName = dept.department || "Unknown";
      const employeeCount = dept._count.id;

      // Filter leaves for this department
      const deptLeaves = leaves.filter(
        (leave) => leave.requester.department === deptName
      );

      // Calculate total days
      const totalLeaveDays = deptLeaves.reduce(
        (sum, leave) => sum + (leave.workingDays || 0),
        0
      );

      // Break down by leave type
      const leavesByType: Record<string, number> = {};
      for (const leave of deptLeaves) {
        const type = leave.type;
        leavesByType[type] = (leavesByType[type] || 0) + (leave.workingDays || 0);
      }

      // Calculate metrics
      const avgDaysPerEmployee =
        employeeCount > 0 ? Math.round((totalLeaveDays / employeeCount) * 10) / 10 : 0;

      // Utilization rate (assuming 30 days entitlement per employee per year)
      const totalEntitlement = employeeCount * 30;
      const utilizationRate =
        totalEntitlement > 0
          ? Math.round((totalLeaveDays / totalEntitlement) * 100)
          : 0;

      departmentSummary.push({
        department: deptName,
        employeeCount,
        totalLeaveDays,
        avgDaysPerEmployee,
        leavesByType,
        utilizationRate,
      });
    }

    // Sort by total leave days descending
    departmentSummary.sort((a, b) => b.totalLeaveDays - a.totalLeaveDays);

    // Generate CSV
    const monthName = month
      ? new Date(year, month - 1, 1).toLocaleString("default", { month: "long" })
      : "Full Year";

    const periodLabel = month ? `${monthName} ${year}` : `Year ${year}`;

    // Get all leave types present in data
    const allLeaveTypes = new Set<string>();
    departmentSummary.forEach((dept) => {
      Object.keys(dept.leavesByType).forEach((type) => allLeaveTypes.add(type));
    });
    const leaveTypeColumns = Array.from(allLeaveTypes).sort();

    const headers = [
      "Department",
      "Employee Count",
      "Total Leave Days",
      "Avg Days/Employee",
      "Utilization %",
      ...leaveTypeColumns.map((type) => `${type} Days`),
    ];

    const rows = departmentSummary.map((dept) => [
      dept.department,
      dept.employeeCount.toString(),
      dept.totalLeaveDays.toString(),
      dept.avgDaysPerEmployee.toString(),
      `${dept.utilizationRate}%`,
      ...leaveTypeColumns.map((type) => (dept.leavesByType[type] || 0).toString()),
    ]);

    // Add totals row
    const totalEmployees = departmentSummary.reduce((sum, d) => sum + d.employeeCount, 0);
    const totalDays = departmentSummary.reduce((sum, d) => sum + d.totalLeaveDays, 0);
    const avgDaysOverall =
      totalEmployees > 0 ? Math.round((totalDays / totalEmployees) * 10) / 10 : 0;
    const overallUtilization =
      totalEmployees > 0 ? Math.round((totalDays / (totalEmployees * 30)) * 100) : 0;

    const totalsByType = leaveTypeColumns.map((type) => {
      return departmentSummary
        .reduce((sum, dept) => sum + (dept.leavesByType[type] || 0), 0)
        .toString();
    });

    rows.push([
      "TOTAL",
      totalEmployees.toString(),
      totalDays.toString(),
      avgDaysOverall.toString(),
      `${overallUtilization}%`,
      ...totalsByType,
    ]);

    // Format CSV
    let csvContent: string;

    if (format === "excel-csv") {
      const bom = "\uFEFF";
      csvContent = bom + [
        `"CDBL Leave Management System - Department Summary Report"`,
        `"Period: ${periodLabel}"`,
        `"Generated: ${new Date().toLocaleString()}"`,
        `"Generated By: ${user.name} (${user.email})"`,
        "",
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\r\n");
    } else {
      csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorEmail: user.email,
        action: "DEPARTMENT_SUMMARY_EXPORT",
        targetEmail: user.email,
        details: {
          year,
          month: month || "Full Year",
          period: periodLabel,
          format,
          departmentCount: departmentSummary.length,
          totalEmployees,
          totalLeaveDays: totalDays,
        },
      },
    });

    const filename = month
      ? `department-summary-${year}-${month.toString().padStart(2, "0")}-${new Date().toISOString().split("T")[0]}.csv`
      : `department-summary-${year}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": format === "excel-csv" ? "text/csv; charset=utf-8" : "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Department summary export error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to generate department summary export", traceId),
      { status: 500 }
    );
  }
}
