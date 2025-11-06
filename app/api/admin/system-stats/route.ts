import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const cache = "no-store";

/**
 * GET /api/admin/system-stats
 * Returns system-level statistics for System Admin dashboard
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Only SYSTEM_ADMIN can access
  if (user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const [totalUsers, activeAdmins] = await Promise.all([
      // Total users in system
      prisma.user.count(),
      // Active admins (HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN)
      prisma.user.count({
        where: {
          role: {
            in: [Role.HR_ADMIN, Role.HR_HEAD, Role.CEO, Role.SYSTEM_ADMIN],
          },
        },
      }),
    ]);

    // Simple health check - could be enhanced with actual system checks
    const systemHealth = "healthy";

    return NextResponse.json({
      totalUsers,
      activeAdmins,
      systemHealth,
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to fetch system stats" },
      { status: 500 }
    );
  }
}


