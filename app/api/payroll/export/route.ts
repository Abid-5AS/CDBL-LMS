import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PayrollCalculator } from "@/lib/payroll/calculator";
import { PayrollExportService } from "@/lib/payroll/export.service";
import { prisma } from "@/lib/prisma";


export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Authorization: Only HR_ADMIN, HR_HEAD, and CEO can access payroll
        if (!user || !["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || "");
        const year = parseInt(searchParams.get("year") || "");
        const department = searchParams.get("department");

        if (isNaN(month) || isNaN(year)) {
            return NextResponse.json(
                { error: "Invalid month or year" },
                { status: 400 }
            );
        }

        const whereClause: any = {};

        if (department) {
            whereClause.department = department;
        }

        const employees = await prisma.user.findMany({
            where: whereClause,
            select: { id: true },
        });

        // Calculate payroll for each employee
        const summaries = await Promise.all(
            employees.map((emp) =>
                PayrollCalculator.calculateMonthlyPayroll(emp.id, month, year)
            )
        );

        // Generate CSV
        const csv = PayrollExportService.generateCSV(summaries);
        const filename = PayrollExportService.getFilename(month, year);

        // Return as download
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("[API] Error generating payroll report:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";
