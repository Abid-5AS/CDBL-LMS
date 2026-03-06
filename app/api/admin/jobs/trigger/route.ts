import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processELAccrual } from "@/scripts/jobs/el-accrual";
import { processAnnualLapse } from "@/scripts/jobs/auto-lapse";
import { processYearEndRollover } from "@/scripts/jobs/year-end-rollover";
import { processAnnualBalanceInit } from "@/scripts/jobs/annual-balance-init";

const ADMIN_ROLES = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN", "CEO"];

type JobType = "el-accrual" | "auto-lapse" | "year-end-rollover" | "init-year";

const JOB_HANDLERS: Record<
  JobType,
  (params?: { year?: number; month?: number; proRata?: boolean; overwrite?: boolean; retroactiveEL?: boolean }) => Promise<any>
> = {
  "el-accrual": async (params) => {
    let targetMonth: Date | undefined;
    if (params?.year !== undefined && params?.month !== undefined) {
      targetMonth = new Date(params.year, params.month, 1);
    }
    return processELAccrual(targetMonth);
  },
  "auto-lapse": async (params) => processAnnualLapse(params?.year),
  "year-end-rollover": async (params) => processYearEndRollover(params?.year),
  "init-year": async (params) =>
    processAnnualBalanceInit({
      year: params?.year,
      proRata: params?.proRata ?? true,
      overwrite: params?.overwrite ?? false,
      retroactiveEL: params?.retroactiveEL ?? false,
    }),
};

/**
 * POST /api/admin/jobs/trigger
 * Semi-automatic job trigger for admin use
 * Body: { job: "el-accrual" | "auto-lapse" | "year-end-rollover" | "init-year", params?: { year?, month?, proRata?, overwrite? } }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { job?: string; params?: Record<string, any> } = {};
    try {
      body = (await request.json()) ?? {};
    } catch {
      // Empty body
    }

    const job = body.job as JobType | undefined;
    if (!job || !JOB_HANDLERS[job]) {
      return NextResponse.json(
        {
          error: "Invalid job",
          validJobs: Object.keys(JOB_HANDLERS),
        },
        { status: 400 }
      );
    }

    const params = body.params ?? {};
    const startTime = Date.now();

    const result = await JOB_HANDLERS[job]({
      year: params.year,
      month: params.month,
      proRata: params.proRata,
      overwrite: params.overwrite,
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      job,
      durationMs,
      summary: Array.isArray(result)
        ? { processed: result.length }
        : result,
      results: result,
    });
  } catch (error) {
    console.error("[Admin jobs trigger] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Job failed",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
