import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { BalanceProjectorService } from "@/lib/services/balance-projector.service";
import { LeaveType } from "@prisma/client";

/**
 * GET /api/balance/projection
 *
 * Get balance projection for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const leaveType = (searchParams.get("leaveType") ||
      "EARNED") as LeaveType;
    const monthsAhead = parseInt(searchParams.get("monthsAhead") || "12", 10);
    const simulateStartDate = searchParams.get("simulateStartDate");
    const simulateEndDate = searchParams.get("simulateEndDate");
    const simulateWorkingDays = searchParams.get("simulateWorkingDays");

    // Validate leave type
    if (!Object.values(LeaveType).includes(leaveType)) {
      return NextResponse.json(
        { error: "Invalid leave type" },
        { status: 400 }
      );
    }

    // Validate months ahead
    if (monthsAhead < 1 || monthsAhead > 24) {
      return NextResponse.json(
        { error: "monthsAhead must be between 1 and 24" },
        { status: 400 }
      );
    }

    const projection = await BalanceProjectorService.projectBalance(
      user.id,
      leaveType,
      monthsAhead,
      simulateStartDate && simulateEndDate && simulateWorkingDays
        ? {
          startDate: new Date(simulateStartDate),
          endDate: new Date(simulateEndDate),
          workingDays: parseFloat(simulateWorkingDays),
        }
        : undefined
    );

    return NextResponse.json(projection);
  } catch (error) {
    console.error("[API] Error fetching balance projection:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch balance projection",
        details: String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
