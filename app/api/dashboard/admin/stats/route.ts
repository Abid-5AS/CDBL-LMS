
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated/prisma/client";

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== "SYSTEM_ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Basic Counts
        const [totalUsers, activeUsers, totalPolicies, totalHolidays] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: { not: Role.EMPLOYEE } } }), // Counting privileged users as "active/admin-like" for now, or just active status if we had it
            (prisma as any).policyConfig.count(),
            prisma.holiday.count({ where: { date: { gte: new Date() } } }),
        ]);

        // 2. Role Distribution
        const usersByRole = await prisma.user.groupBy({
            by: ["role"],
            _count: {
                role: true,
            },
        });

        // 3. Recent Audit Logs (for quick view)
        const recentLogs = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        // 4. System Health Simulation (DB Latency)
        const start = Date.now();
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (e) {
            console.error("Health check failed", e);
        }
        const latency = Date.now() - start;

        return NextResponse.json({
            totalUsers,
            privilegedUsers: activeUsers,
            totalPolicies,
            upcomingHolidays: totalHolidays,
            usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count.role })),
            recentLogs: recentLogs.map(log => ({
                ...log,
                user: log.actorEmail || "System",
            })),
            systemHealth: {
                status: latency < 1000 ? "healthy" : "degraded",
                latency: latency,
                message: latency < 1000 ? "All systems operational" : "High system latency detected"
            }
        });

    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
