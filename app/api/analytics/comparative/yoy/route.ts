import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";
import { format, subYears } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const cacheKey = `yoy-comparison:${new Date().getFullYear()}`;

        const data = await getCachedAnalytics(
            cacheKey,
            async () => {
                const currentYear = new Date().getFullYear();
                const previousYear = currentYear - 1;

                // Fetch current year data
                const currentLeaves = await prisma.leaveRequest.groupBy({
                    by: ["startDate"],
                    where: {
                        startDate: {
                            gte: new Date(currentYear, 0, 1),
                            lte: new Date(currentYear, 11, 31),
                        },
                        status: "APPROVED",
                    },
                    _count: { id: true },
                });

                // Fetch previous year data
                const previousLeaves = await prisma.leaveRequest.groupBy({
                    by: ["startDate"],
                    where: {
                        startDate: {
                            gte: new Date(previousYear, 0, 1),
                            lte: new Date(previousYear, 11, 31),
                        },
                        status: "APPROVED",
                    },
                    _count: { id: true },
                });

                // Aggregate by month
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const chartData = months.map((month, index) => {
                    const currentCount = currentLeaves
                        .filter(l => l.startDate.getMonth() === index)
                        .reduce((acc, curr) => acc + curr._count.id, 0);

                    const previousCount = previousLeaves
                        .filter(l => l.startDate.getMonth() === index)
                        .reduce((acc, curr) => acc + curr._count.id, 0);

                    return {
                        period: month,
                        current: currentCount,
                        previous: previousCount,
                    };
                });

                return { chartData };
            },
            CACHE_TTL.HISTORICAL // Cache for 24 hours
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching YoY data:", error);
        return NextResponse.json(
            { error: "Failed to fetch YoY data" },
            { status: 500 }
        );
    }
}
