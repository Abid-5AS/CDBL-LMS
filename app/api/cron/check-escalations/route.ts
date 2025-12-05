import { NextResponse } from "next/server";
import { EscalationService } from "@/lib/services/escalation-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Verify cron secret if needed (e.g. from Vercel Cron)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await EscalationService.checkOverdueApprovals();

    return NextResponse.json({
      success: true,
      message: `Escalation check completed. Escalated ${result.escalatedCount} approvals.`,
      data: result,
    });
  } catch (error) {
    console.error("Escalation cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
