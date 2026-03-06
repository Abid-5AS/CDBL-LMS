import { NextRequest, NextResponse } from "next/server";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";
import { LeaveForecast } from "@/lib/analytics/forecasting";

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
                // Generate forecast using LeaveForecast
                const forecasts = await LeaveForecast.forecastLeaveVolume(monthsParam);

                // Format for chart
                const chartData = forecasts.map(f => {
                    // f.period is "YYYY-MM"
                    const [year, month] = f.period.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    
                    return {
                        period: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
                        forecast: f.forecastedLeaveDays,
                        confidenceLower: f.confidenceInterval.lower,
                        confidenceUpper: f.confidenceInterval.upper,
                        trend: f.trend
                    };
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

export const dynamic = "force-dynamic";
