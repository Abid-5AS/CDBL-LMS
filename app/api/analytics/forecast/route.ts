import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";
import { linearRegressionForecast } from "@/lib/analytics/forecasting";
import { format, subMonths, addMonths } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const monthsParam = parseInt(searchParams.get("months") || "3");

        const cacheKey = `forecast:${monthsParam}`;

        const data = await getCachedAnalytics(
            cacheKey,
            async () => {
                // Fetch last 12 months of data
                const endDate = new Date();
                const startDate = subMonths(endDate, 12);

                const leaves = await prisma.leaveRequest.findMany({
                    where: {
                        startDate: { gte: startDate, lte: endDate },
                        status: "APPROVED",
                    },
                    select: { startDate: true },
                });

                // Aggregate by month index (0-11 relative to start date)
                const monthlyCounts: number[] = new Array(13).fill(0);

                leaves.forEach(l => {
                    const monthDiff = (l.startDate.getFullYear() - startDate.getFullYear()) * 12 + (l.startDate.getMonth() - startDate.getMonth());
                    if (monthDiff >= 0 && monthDiff <= 12) {
                        monthlyCounts[monthDiff]++;
                    }
                });

                const history = monthlyCounts.map((val, idx) => ({
                    period: idx,
                    value: val
                }));

                // Generate forecast
                const forecast = linearRegressionForecast(history, monthsParam);

                // Format for chart
                const chartData = [];

                // Add historical points
                history.forEach(h => {
                    const date = addMonths(startDate, h.period);
                    chartData.push({
                        period: format(date, "MMM yyyy"),
                        actual: h.value,
                    });
                });

                // Add forecast points
                forecast.forEach(f => {
                    const date = addMonths(startDate, f.period);
                    chartData.push({
                        period: format(date, "MMM yyyy"),
                        forecast: f.value,
                        confidenceLower: f.confidenceLower,
                        confidenceUpper: f.confidenceUpper,
                    });
                });

                return { chartData };
            },
            CACHE_TTL.AGGREGATION
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching forecast data:", error);
        return NextResponse.json(
            { error: "Failed to fetch forecast data" },
            { status: 500 }
        );
    }
}
