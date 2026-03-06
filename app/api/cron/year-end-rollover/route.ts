import { NextRequest, NextResponse } from "next/server";
import { processYearEndRollover } from "@/scripts/jobs/year-end-rollover";

/**
 * Year-End EL Rollover Cron Job
 *
 * Triggered by Vercel Cron on Jan 1 (after auto-lapse)
 *
 * Policy 6.19: EL carries forward up to 60 days; excess to SPECIAL (120 cap)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting year-end rollover job");
    const startTime = Date.now();

    const results = await processYearEndRollover();

    const summary = {
      totalEmployees: results.length,
      totalELCarried: results.reduce((s, r) => s + r.elCarried, 0),
      totalExcessToSpecial: results.reduce((s, r) => s + r.elExcessToSpecial, 0),
      durationMs: Date.now() - startTime,
    };

    console.log("[Cron] Year-end rollover completed:", summary);

    return NextResponse.json(
      { success: true, message: "Year-end rollover completed", summary, results },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Cron] Year-end rollover failed:", error);
    return NextResponse.json(
      { success: false, error: "Year-end rollover failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

export const dynamic = "force-dynamic";
