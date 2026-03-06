import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus, LeaveType } from "@/src/generated/prisma/client";
import { getCalendarEvents } from "@/lib/services/calendar-service";

/**
 * GET /api/calendar/leaves
 *
 * Returns leave events for calendar display
 *
 * Query params:
 * - month: number (0-11)
 * - year: number
 * - view: "my" | "team" | "department" | "all"
 * - type: LeaveType (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const view = (searchParams.get("view") || "my") as "my" | "team" | "department" | "all";
    const typeFilter = searchParams.get("type") as LeaveType | null;

    const result = await getCalendarEvents({
      userId: user.id,
      userRole: user.role,
      userDepartment: user.department,
      month,
      year,
      view,
      typeFilter,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[CALENDAR_LEAVES_API_ERROR]", error);
    if (error.message === "Forbidden - Admin access required") {
       return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
