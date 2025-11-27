import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";
import { parseISO } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const startDate = startDateParam ? parseISO(startDateParam) : new Date(new Date().getFullYear(), 0, 1);
        const endDate = endDateParam ? parseISO(endDateParam) : new Date();

        const cacheKey = `funnel:${startDate.toISOString()}:${endDate.toISOString()}`;

        const data = await getCachedAnalytics(
            cacheKey,
            async () => {
                // 1. Total Requests Submitted
                const totalRequests = await prisma.leaveRequest.count({
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                        status: { not: "DRAFT" },
                    },
                });

                // 2. Approved by Dept Head (Step 2)
                // Assuming step 2 is Dept Head. We count approvals where step >= 2 or status is APPROVED/REJECTED at higher levels
                // A simpler proxy is to check Approval table
                const step1Approvals = await prisma.approval.count({
                    where: {
                        step: 1,
                        decision: "APPROVED",
                        decidedAt: { gte: startDate, lte: endDate }
                    }
                });

                const step2Approvals = await prisma.approval.count({
                    where: {
                        step: 2,
                        decision: "APPROVED",
                        decidedAt: { gte: startDate, lte: endDate }
                    }
                });

                const step3Approvals = await prisma.approval.count({
                    where: {
                        step: 3,
                        decision: "APPROVED",
                        decidedAt: { gte: startDate, lte: endDate }
                    }
                });

                // 3. Final Approvals
                const finalApprovals = await prisma.leaveRequest.count({
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                        status: "APPROVED",
                    },
                });

                return [
                    { name: "Submitted", value: totalRequests, fill: "#3b82f6" },
                    { name: "HR Verified", value: step1Approvals, fill: "#8b5cf6" },
                    { name: "Dept Head Approved", value: step2Approvals, fill: "#ec4899" },
                    { name: "Final Approval", value: finalApprovals, fill: "#10b981" },
                ];
            },
            CACHE_TTL.AGGREGATION
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching funnel data:", error);
        return NextResponse.json(
            { error: "Failed to fetch funnel data" },
            { status: 500 }
        );
    }
}
