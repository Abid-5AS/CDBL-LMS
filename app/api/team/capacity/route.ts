import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TeamCapacityService } from "@/lib/services/team-capacity.service";

/**
 * GET /api/team/capacity
 *
 * Get team capacity analysis for department head
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO, and SYSTEM_ADMIN can access
    const allowedRoles = [
      "DEPT_HEAD",
      "HR_ADMIN",
      "HR_HEAD",
      "CEO",
      "SYSTEM_ADMIN",
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get("department") || undefined;
    const daysAhead = parseInt(searchParams.get("daysAhead") || "30", 10);

    // For DEPT_HEAD, use their department if not specified
    const targetDepartment =
      user.role === "DEPT_HEAD" ? user.department || department : department;

    // Validate days ahead
    if (daysAhead < 1 || daysAhead > 90) {
      return NextResponse.json(
        { error: "daysAhead must be between 1 and 90" },
        { status: 400 }
      );
    }

    const capacity = await TeamCapacityService.analyzeTeamCapacity(
      targetDepartment,
      daysAhead
    );

    return NextResponse.json(capacity);
  } catch (error) {
    console.error("[API] Error fetching team capacity:", error);
    return NextResponse.json(
      { error: "Failed to fetch team capacity" },
      { status: 500 }
    );
  }
}
