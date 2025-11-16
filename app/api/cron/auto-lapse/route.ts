import { NextRequest, NextResponse } from "next/server";
import { processAnnualLapse } from "@/scripts/jobs/auto-lapse";

/**
 * Annual Leave Lapse Cron Job
 *
 * Triggered by Vercel Cron at 11:59 PM on December 31 (Asia/Dhaka)
 *
 * Policy 6.16 & 6.21.a: All leave except EL lapses at year-end
 * - Resets Casual Leave (CL) to 0
 * - Resets Medical Leave (ML) to 0
 * - Resets Quarantine Leave to 0
 * - Creates audit logs for all lapsed balances
 * - EL carry-forward is handled separately by year-end rollover job
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron] Starting annual leave lapse job");
    const startTime = Date.now();

    // Process leave lapse for all lapsing leave types
    const results = await processAnnualLapse();

    const duration = Date.now() - startTime;

    // Group results by leave type for summary
    const byType = results.reduce((acc, r) => {
      if (!acc[r.leaveType]) {
        acc[r.leaveType] = { count: 0, totalDays: 0 };
      }
      acc[r.leaveType].count++;
      acc[r.leaveType].totalDays += r.previousBalance;
      return acc;
    }, {} as Record<string, { count: number; totalDays: number }>);

    const summary = {
      totalBalancesLapsed: results.length,
      byLeaveType: byType,
      durationMs: duration,
    };

    console.log("[Cron] Annual leave lapse job completed:", summary);

    return NextResponse.json(
      {
        success: true,
        message: "Annual leave lapse completed successfully",
        summary,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Cron] Annual leave lapse job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow manual trigger via POST (for testing/admin)
export async function POST(request: NextRequest) {
  return GET(request);
}
