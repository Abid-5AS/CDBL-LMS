import { PrismaClient } from "@prisma/client";
import { ReportConfig } from "@/components/reports/builder/ConfigPanel";
import { format } from "date-fns";

const prisma = new PrismaClient();

export async function executeReport(config: ReportConfig) {
    // 1. Determine Group By (Dimension)
    let groupByField: any = config.dimension;

    // Map frontend dimension names to database fields
    const dimensionMap: Record<string, string> = {
        department: "department", // On User model
        leave_type: "type",
        status: "status",
        month: "startDate", // Needs special handling
        employee: "requesterId",
    };

    const dbDimension = dimensionMap[config.dimension];

    // 2. Fetch Data
    // Prisma doesn't support dynamic joins with groupBy easily in a single typed call for all cases.
    // We might need raw queries or separate logic per dimension.

    let results: any[] = [];

    if (config.dimension === "department") {
        // Group by User.department
        // We need to join LeaveRequest -> User
        const leaves = await prisma.leaveRequest.findMany({
            where: { status: "APPROVED" },
            include: { requester: { select: { department: true } } },
        });

        const grouped = leaves.reduce((acc, leave) => {
            const dept = leave.requester.department || "Unknown";
            if (!acc[dept]) acc[dept] = { count: 0, days: 0 };
            acc[dept].count++;
            acc[dept].days += leave.workingDays;
            return acc;
        }, {} as Record<string, { count: number; days: number }>);

        results = Object.entries(grouped).map(([label, stats]) => ({
            label,
            value: config.metric === "leave_days" ? stats.days : stats.count,
        }));

    } else if (config.dimension === "leave_type") {
        const grouped = await prisma.leaveRequest.groupBy({
            by: ["type"],
            where: { status: "APPROVED" },
            _count: { id: true },
            _sum: { workingDays: true },
        });

        results = grouped.map((g) => ({
            label: g.type,
            value: config.metric === "leave_days" ? (g._sum.workingDays || 0) : g._count.id,
        }));

    } else if (config.dimension === "month") {
        // Group by month of startDate
        // Prisma doesn't support date_trunc in groupBy directly without raw query.
        // Fetch all and aggregate in JS for simplicity (assuming reasonable dataset size for this MVP)
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                status: "APPROVED",
                startDate: { gte: new Date(new Date().getFullYear(), 0, 1) } // Current year
            },
            select: { startDate: true, workingDays: true },
        });

        const monthlyStats = new Array(12).fill(0);
        leaves.forEach(l => {
            const month = l.startDate.getMonth();
            const val = config.metric === "leave_days" ? l.workingDays : 1;
            monthlyStats[month] += val;
        });

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        results = months.map((label, idx) => ({
            label,
            value: monthlyStats[idx]
        }));

    } else if (config.dimension === "employee") {
        const leaves = await prisma.leaveRequest.findMany({
            where: { status: "APPROVED" },
            include: { requester: { select: { name: true } } }
        });

        const grouped = leaves.reduce((acc, leave) => {
            const name = leave.requester.name;
            if (!acc[name]) acc[name] = { count: 0, days: 0 };
            acc[name].count++;
            acc[name].days += leave.workingDays;
            return acc;
        }, {} as Record<string, { count: number; days: number }>);

        results = Object.entries(grouped)
            .map(([label, stats]) => ({
                label,
                value: config.metric === "leave_days" ? stats.days : stats.count
            }))
            .sort((a, b) => b.value - a.value) // Sort by value desc
            .slice(0, 20); // Top 20
    }

    return results;
}
