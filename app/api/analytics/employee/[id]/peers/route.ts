import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const employeeId = parseInt(id);

        const cacheKey = `employee-peers:${employeeId}`;

        const data = await getCachedAnalytics(
            cacheKey,
            async () => {
                // Fetch target employee
                const employee = await prisma.user.findUnique({
                    where: { id: employeeId },
                    include: {
                        leaves: { where: { status: "APPROVED" } },
                        balances: { where: { year: new Date().getFullYear() } },
                    },
                });

                if (!employee) throw new Error("Employee not found");

                // Fetch department peers
                const peers = await prisma.user.findMany({
                    where: {
                        department: employee.department,
                        id: { not: employeeId },
                        role: "EMPLOYEE", // Compare with other employees
                    },
                    include: {
                        leaves: { where: { status: "APPROVED" } },
                    },
                });

                // Calculate Employee Metrics
                const empLeaves = employee.leaves.length;
                const empTotalDays = employee.leaves.reduce((acc, l) => acc + l.workingDays, 0);
                const empBalance = employee.balances.reduce((acc, b) => acc + b.closing, 0); // Total remaining
                // Utilization: (Used / (Used + Remaining)) * 100 roughly, or just Used if we knew total entitlement
                // Let's use a simplified score 0-100 for radar chart

                // Calculate Dept Averages
                const deptTotalLeaves = peers.reduce((acc, p) => acc + p.leaves.length, 0);
                const deptAvgLeaves = peers.length > 0 ? deptTotalLeaves / peers.length : 0;

                const deptTotalDays = peers.reduce((acc, p) => acc + p.leaves.reduce((sum, l) => sum + l.workingDays, 0), 0);
                const deptAvgDays = peers.length > 0 ? deptTotalDays / peers.length : 0;

                // Normalize scores for Radar Chart (0-100)
                // This is a heuristic mapping
                const normalize = (val: number, max: number) => Math.min(100, Math.max(0, (val / max) * 100));

                return {
                    employee: {
                        name: employee.name,
                        department: employee.department,
                        totalLeaves: empTotalDays,
                        avgDuration: empLeaves > 0 ? (empTotalDays / empLeaves).toFixed(1) : 0,
                        balance: empBalance,
                        utilization: 65, // Mock for now, requires entitlement logic
                        frequencyScore: normalize(empLeaves, 20),
                        durationScore: normalize(empTotalDays, 40),
                        noticeScore: 80, // Mock
                        approvalScore: 90, // Mock
                    },
                    department: {
                        frequencyScore: normalize(deptAvgLeaves, 20),
                        durationScore: normalize(deptAvgDays, 40),
                        noticeScore: 75,
                        approvalScore: 85,
                        utilization: 60,
                    },
                    percentile: 85, // Mock percentile rank
                };
            },
            CACHE_TTL.AGGREGATION
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching peer comparison:", error);
        return NextResponse.json(
            { error: "Failed to fetch peer comparison" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";
