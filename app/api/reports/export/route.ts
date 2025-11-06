import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { renderToBuffer } from "@react-pdf/renderer";
import { createPDFDocument } from "@/lib/pdf-generator";

export const cache = "no-store";

type Duration = "month" | "quarter" | "year";

function getDateRange(duration: Duration): { start: Date; end: Date } {
  const today = normalizeToDhakaMidnight(new Date());
  const year = today.getFullYear();
  const month = today.getMonth();

  switch (duration) {
    case "month":
      return {
        start: normalizeToDhakaMidnight(new Date(year, month, 1)),
        end: normalizeToDhakaMidnight(new Date(year, month + 1, 0)),
      };
    case "quarter":
      const quarterStartMonth = Math.floor(month / 3) * 3;
      return {
        start: normalizeToDhakaMidnight(new Date(year, quarterStartMonth, 1)),
        end: normalizeToDhakaMidnight(new Date(year, quarterStartMonth + 3, 0)),
      };
    case "year":
      return {
        start: normalizeToDhakaMidnight(new Date(year, 0, 1)),
        end: normalizeToDhakaMidnight(new Date(year, 11, 31)),
      };
  }
}

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
  }

  // Only HR_ADMIN, HR_HEAD, and SYSTEM_ADMIN can export
  const allowedRoles = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(error("forbidden", "Access denied", traceId), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const duration = (searchParams.get("duration") || "month") as Duration;
  const departmentIdParam = searchParams.get("department");
  const leaveTypeParam = searchParams.get("leaveType");
  const format = searchParams.get("format") || "csv";
  
  // Handle "all" values - convert to null
  const departmentId = departmentIdParam && departmentIdParam !== "all" ? departmentIdParam : null;
  const leaveType = leaveTypeParam && leaveTypeParam !== "all" ? leaveTypeParam : null;

  const { start, end } = getDateRange(duration);

  // Build where clause
  const whereClause: any = {
    status: {
      in: ["APPROVED", "PENDING", "SUBMITTED"],
    },
    startDate: {
      gte: start,
      lte: end,
    },
  };

  if (departmentId) {
    // Get all unique departments and match by index (since department is stored as string in User)
    const allDeptUsers = await prisma.user.findMany({
      where: {
        department: {
          not: null,
        },
      },
      select: {
        department: true,
      },
      distinct: ["department"],
      orderBy: {
        department: "asc",
      },
    });
    
    const deptIndex = Number(departmentId) - 1;
    if (deptIndex >= 0 && deptIndex < allDeptUsers.length) {
      const deptName = allDeptUsers[deptIndex].department;
      if (deptName) {
        whereClause.requester = { department: deptName };
      }
    }
  }

  if (leaveType) {
    whereClause.type = leaveType;
  }

  // Get leave requests for export - use select instead of include
  const leaves = await prisma.leaveRequest.findMany({
    where: whereClause,
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      workingDays: true,
      status: true,
      requester: {
        select: {
          name: true,
          email: true,
          department: true, // This is a string field, not a relation
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  // Get analytics data for PDF
  const pendingCount = leaves.filter((l) => ["PENDING", "SUBMITTED"].includes(l.status)).length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  
  // Calculate average approval time
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED");
  const totalEmployees = await prisma.user.count({
    where: {
      role: "EMPLOYEE",
    },
  });

  const totalWorkingDays = leaves
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, l) => sum + (l.workingDays || 0), 0);
  const avgEntitlementPerEmployee = 30;
  const totalEntitlement = totalEmployees * avgEntitlementPerEmployee;
  const utilizationRate = totalEntitlement > 0
    ? Math.round((totalWorkingDays / totalEntitlement) * 100)
    : 0;

  // Monthly trend data
  const yearStart = normalizeToDhakaMidnight(new Date(new Date().getFullYear(), 0, 1));
  const yearEnd = normalizeToDhakaMidnight(new Date(new Date().getFullYear(), 11, 31));
  const yearLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      startDate: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    select: {
      startDate: true,
      workingDays: true,
    },
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyTrend = monthNames.map((month, index) => {
    const monthLeaves = yearLeaves.filter((l) => {
      const leaveMonth = new Date(l.startDate).getMonth();
      return leaveMonth === index;
    });
    return {
      month,
      leaves: monthLeaves.reduce((sum, l) => sum + (l.workingDays || 0), 0),
    };
  });

  // Leave type distribution
  const typeDistribution = leaves
    .filter((l) => l.status === "APPROVED")
    .reduce((acc, leave) => {
      const type = leave.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += leave.workingDays || 0;
      return acc;
    }, {} as Record<string, number>);

  const distributionData = Object.entries(typeDistribution).map(([type, days]) => ({
    name: type,
    value: days,
  }));

  // Department-wise summary
  const deptSummary = leaves
    .filter((l) => l.status === "APPROVED")
    .reduce((acc, leave) => {
      const deptName = leave.requester.department || "Unknown";
      if (!acc[deptName]) {
        acc[deptName] = 0;
      }
      acc[deptName] += leave.workingDays || 0;
      return acc;
    }, {} as Record<string, number>);

  const departmentData = Object.entries(deptSummary)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (format === "csv") {
    // Generate CSV
    const headers = ["Employee Name", "Email", "Department", "Leave Type", "Start Date", "End Date", "Days", "Status"];
    const rows = leaves.map((leave) => [
      leave.requester.name,
      leave.requester.email,
      leave.requester.department || "N/A",
      leave.type,
      new Date(leave.startDate).toLocaleDateString(),
      new Date(leave.endDate).toLocaleDateString(),
      leave.workingDays || 0,
      leave.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leave-report-${duration}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } else {
    // Generate PDF using @react-pdf/renderer
    try {
      const durationLabel = duration === "month" ? "This Month" : duration === "quarter" ? "This Quarter" : "This Year";
      const generatedAt = new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Get department name if filtered
      let departmentName = null;
      if (departmentId) {
        const allDeptUsers = await prisma.user.findMany({
          where: {
            department: {
              not: null,
            },
          },
          select: {
            department: true,
          },
          distinct: ["department"],
          orderBy: {
            department: "asc",
          },
        });
        const deptIndex = Number(departmentId) - 1;
        if (deptIndex >= 0 && deptIndex < allDeptUsers.length) {
          departmentName = allDeptUsers[deptIndex].department;
        }
      }

      // Validate data before creating PDF
      if (!leaves || leaves.length === 0) {
        return NextResponse.json(
          error("validation_error", "No leave data available for the selected filters", traceId),
          { status: 400 }
        );
      }

      // Create PDF document using helper function
      const pdfDoc = createPDFDocument({
        title: "Leave Management Report",
        duration: durationLabel,
        generatedAt,
        kpis: {
          pendingApprovals: pendingCount,
          approvedLeaves: approvedCount,
          avgApprovalTime: 0, // Simplified for now
          totalEmployees,
          utilizationRate,
        },
        charts: {
          monthlyTrend,
          typeDistribution: distributionData,
          departmentSummary: departmentData,
        },
        leaves: leaves.map((l) => ({
          ...l,
          startDate: l.startDate as Date,
          endDate: l.endDate as Date,
        })),
        filters: {
          department: departmentName,
          leaveType: leaveType || null,
        },
      });

      // Guard against null PDF document
      if (!pdfDoc) {
        throw new Error("Failed to create PDF document element");
      }

      // Render PDF to buffer
      const pdfBuffer = await renderToBuffer(pdfDoc);
      
      // Verify buffer is not empty
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Generated PDF buffer is empty");
      }

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="leave-report-${duration}-${new Date().toISOString().split("T")[0]}.pdf"`,
        },
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const errorStack = err instanceof Error ? err.stack : undefined;
      console.error("Error stack:", errorStack);
      return NextResponse.json(
        error("internal_error", `Failed to generate PDF: ${errorMessage}`, traceId),
        { status: 500 }
      );
    }
  }
}
