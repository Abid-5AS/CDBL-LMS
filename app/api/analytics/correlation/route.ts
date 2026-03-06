import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const xAxis = searchParams.get("xAxis") || "tenure";
        const yAxis = searchParams.get("yAxis") || "leaveFrequency";
        const department = searchParams.get("department");

        const cacheKey = `correlation:${xAxis}:${yAxis}:${department || "all"}`;

        const data = await getCachedAnalytics(
            cacheKey,
            async () => {
                // Fetch users with their leave stats
                const users = await prisma.user.findMany({
                    where: department ? { department } : {},
                    include: {
                        leaves: {
                            where: { status: "APPROVED" },
                        },
                    },
                });

                // Calculate metrics for each user
                const points = users.map((u) => {
                    // Calculate X Axis Metric
                    let xValue = 0;
                    if (xAxis === "tenure") {
                        const joinDate = u.joinDate ? new Date(u.joinDate) : new Date();
                        xValue = (new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365); // Years
                    }

                    // Calculate Y Axis Metric
                    let yValue = 0;
                    if (yAxis === "leaveFrequency") {
                        yValue = u.leaves.length;
                    } else if (yAxis === "avgDuration") {
                        const totalDays = u.leaves.reduce((acc, l) => acc + l.workingDays, 0);
                        yValue = u.leaves.length > 0 ? totalDays / u.leaves.length : 0;
                    }

                    return {
                        x: Number(xValue.toFixed(2)),
                        y: Number(yValue.toFixed(2)),
                        z: 1, // Default bubble size
                        name: u.name,
                        group: u.department || "Unknown",
                    };
                });

                return points;
            },
            CACHE_TTL.AGGREGATION
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching correlation data:", error);
        return NextResponse.json(
            { error: "Failed to fetch correlation data" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";
