import { NextRequest, NextResponse } from "next/server";
import { processELAccrual } from "@/scripts/jobs/el-accrual";

/**
 * Monthly EL Accrual Cron Job
 *
 * Triggered by Vercel Cron at midnight on the 1st of every month (Asia/Dhaka)
 *
 * Policy 6.19: Earned Leave accrues at 2 days per month
 * - Adds 2 days EL to all employees who were on duty during the month
 * - Handles 60-day carry-forward cap
 * - Transfers excess to SPECIAL leave (up to 120 days)
 * - Creates audit logs for all accruals
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

    console.log("[Cron] Starting EL accrual job");
    const startTime = Date.now();

    // Process EL accrual for all employees
    const results = await processELAccrual();

    const duration = Date.now() - startTime;
    const summary = {
      totalEmployees: results.length,
      accrued: results.filter((r) => !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length,
      totalDaysAccrued: results.reduce((sum, r) => sum + r.accrued, 0),
      durationMs: duration,
    };

    console.log("[Cron] EL accrual job completed:", summary);

    return NextResponse.json(
      {
        success: true,
        message: "EL accrual completed successfully",
        summary,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Cron] EL accrual job failed:", error);

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
