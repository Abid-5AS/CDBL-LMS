import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { BalanceAdjustmentService } from "@/lib/services/balance-adjustment.service";
import { LeaveType, Role } from "@/src/generated/prisma/client";
import { z } from "zod";

const adjustBalanceSchema = z.object({
  userId: z.number().int().positive(),
  leaveType: z.nativeEnum(LeaveType),
  year: z.number().int().min(2020).max(2100),
  amount: z.number().int().refine((val) => val !== 0, {
    message: "Amount cannot be zero",
  }),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

/**
 * POST /api/admin/balance/adjust
 *
 * Manually adjust employee leave balance (SYSTEM_ADMIN only)
 *
 * Request body:
 * {
 *   userId: number,
 *   leaveType: LeaveType,
 *   year: number,
 *   amount: number (positive for credit, negative for debit),
 *   reason: string (min 10 characters)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is SYSTEM_ADMIN
    if (user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: "Only SYSTEM_ADMIN can adjust balances" },
        { status: 403 }
      );
    }

    const adminId = user.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = adjustBalanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { userId, leaveType, year, amount, reason } = validation.data;

    // Perform adjustment
    const result = await BalanceAdjustmentService.adjustBalance(
      userId,
      leaveType,
      year,
      amount,
      reason,
      adminId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || "Adjustment failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("[API] Error adjusting balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/balance/adjust?userId=123&year=2025
 *
 * Get adjustment history for an employee
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is SYSTEM_ADMIN
    if (user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: "Only SYSTEM_ADMIN can view adjustment history" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const year = searchParams.get("year");
    const leaveType = searchParams.get("leaveType");
    const limit = searchParams.get("limit");

    if (userId) {
      // Get history for specific user
      const history = await BalanceAdjustmentService.getAdjustmentHistory(
        parseInt(userId),
        {
          year: year ? parseInt(year) : undefined,
          leaveType: leaveType as LeaveType | undefined,
          limit: limit ? parseInt(limit) : undefined,
        }
      );

      return NextResponse.json({ history });
    } else {
      // Get recent adjustments system-wide
      const history = await BalanceAdjustmentService.getRecentAdjustments(
        limit ? parseInt(limit) : 100
      );

      return NextResponse.json({ history });
    }
  } catch (error) {
    console.error("[API] Error getting adjustment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
