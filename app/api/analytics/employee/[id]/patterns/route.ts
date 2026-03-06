import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";
import { detectAnomalies } from "@/lib/analytics/anomaly-detection";
import { differenceInDays, getDay, getQuarter } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const employeeId = parseInt(id);

        // Permission check: Only allow if self, manager, or HR
        if (user.id !== employeeId && user.role === "EMPLOYEE") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const cacheKey = `employee-patterns:${employeeId}`;

        const data = await getCachedAnalytics(
            cacheKey,
            async () => {
                // Fetch all leaves
                const leaves = await prisma.leaveRequest.findMany({
                    where: {
                        requesterId: employeeId,
                        status: { not: "DRAFT" },
                    },
                    orderBy: { startDate: "desc" },
                });

                // 1. Timeline Data
                const timeline = leaves.map((l) => ({
                    id: l.id,
                    startDate: l.startDate.toISOString(),
                    endDate: l.endDate.toISOString(),
                    type: l.type,
                    status: l.status,
                    reason: l.reason,
                }));

                // 2. Patterns Analysis
                const preferredDays: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
                const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                let totalAdvanceNotice = 0;
                const leaveTypeCounts: Record<string, number> = {};

                leaves.forEach((l) => {
                    // Day preference
                    const day = daysMap[getDay(new Date(l.startDate))];
                    if (preferredDays[day] !== undefined) preferredDays[day]++;

                    // Advance notice
                    const notice = differenceInDays(new Date(l.startDate), new Date(l.createdAt));
                    totalAdvanceNotice += Math.max(0, notice);

                    // Type frequency
                    leaveTypeCounts[l.type] = (leaveTypeCounts[l.type] || 0) + 1;
                });

                const avgAdvanceNotice = leaves.length > 0 ? totalAdvanceNotice / leaves.length : 0;

                // Leave Type Distribution for Pie Chart
                const leaveTypeFrequency = Object.entries(leaveTypeCounts).map(([name, value]) => ({
                    name,
                    value,
                    color: undefined // Will be assigned by component
                }));

                // 3. Anomalies
                const anomalies = detectAnomalies(leaves);

                // 4. Heatmap Data (simplified for this endpoint, or fetch separately)
                // We can reuse the logic from heatmap route if needed, but for now let's return basic dates
                const heatmap = leaves.filter(l => l.status === 'APPROVED').map(l => ({
                    date: l.startDate.toISOString().slice(0, 10),
                    value: 1,
                    details: [{ type: l.type }]
                }));

                return {
                    timeline,
                    patterns: {
                        preferredDays,
                        avgAdvanceNotice,
                        leaveTypeFrequency
                    },
                    anomalies,
                    heatmap
                };
            },
            CACHE_TTL.DASHBOARD // 5 minutes cache for individual data
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching employee patterns:", error);
        return NextResponse.json(
            { error: "Failed to fetch employee patterns" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";
