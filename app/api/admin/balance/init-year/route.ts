import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processAnnualBalanceInit } from "@/scripts/jobs/annual-balance-init";

const ADMIN_ROLES = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN", "CEO"];

/**
 * POST /api/admin/balance/init-year
 * Initialize CL and ML balances for a year (semi-automatic trigger)
 * Body: { year?: number, proRata?: boolean, overwrite?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { year?: number; proRata?: boolean; overwrite?: boolean; retroactiveEL?: boolean } = {};
    try {
      body = (await request.json()) ?? {};
    } catch {
      // Empty body ok
    }

    const year = body.year ?? new Date().getFullYear();
    const proRata = body.proRata ?? true;
    const overwrite = body.overwrite ?? false;
    const retroactiveEL = body.retroactiveEL ?? false;

    const results = await processAnnualBalanceInit({
      year,
      proRata,
      overwrite,
      retroactiveEL,
    });

    return NextResponse.json({
      success: true,
      message: `Initialized balances for ${results.length} employees`,
      summary: {
        year,
        employeesProcessed: results.length,
        proRata,
        overwrite,
      },
      results,
    });
  } catch (error) {
    console.error("[Init-year] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Init failed",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
