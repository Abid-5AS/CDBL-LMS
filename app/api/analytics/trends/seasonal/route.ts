import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";
import { getMonth, format } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const department = searchParams.get("department");
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        const cacheKey = `seasonal-trends:${year}:${department || "all"}`;

        const data = await getCachedAnalytics(
            cacheKey,
            async () => {
                const startDate = new Date(year, 0, 1);
                const endDate = new Date(year, 11, 31);

                const where: any = {
                    startDate: { gte: startDate, lte: endDate },
                    status: "APPROVED",
                };

                if (department) {
                    where.requester = { department };
                }

                const leaves = await prisma.leaveRequest.findMany({
                    where,
                    select: { startDate: true, type: true },
                });

                // Monthly aggregation
                const monthlyData = Array.from({ length: 12 }).map((_, i) => ({
                    month: format(new Date(year, i, 1), "MMM"),
                    count: 0,
                    types: {} as Record<string, number>,
                }));

                leaves.forEach((leave) => {
                    const monthIndex = getMonth(new Date(leave.startDate));
                    monthlyData[monthIndex].count++;
                    monthlyData[monthIndex].types[leave.type] = (monthlyData[monthIndex].types[leave.type] || 0) + 1;
                });

                // Identify peaks
                const sortedMonths = [...monthlyData].sort((a, b) => b.count - a.count);
                const peaks = sortedMonths.slice(0, 3).map(m => ({
                    month: m.month,
                    count: m.count,
                    reason: "High Volume" // Placeholder for more complex logic
                }));

                // Simple prediction for next year (naive: same as this year)
                const predictions = monthlyData.map(m => ({
                    month: m.month,
                    estimatedLeaves: Math.round(m.count * 1.1) // Assume 10% growth
                }));

                return {
                    monthlyTrends: monthlyData,
                    peaks,
                    predictions
                };
            },
            CACHE_TTL.AGGREGATION
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching seasonal trends:", error);
        return NextResponse.json(
            { error: "Failed to fetch seasonal trends" },
            { status: 500 }
        );
    }
}
