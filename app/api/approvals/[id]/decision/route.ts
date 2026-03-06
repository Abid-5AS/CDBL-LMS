import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { resolveLeave } from "../../resolve-leave";

export const cache = "no-store";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const decision = parsed.data.action === "approve" ? "APPROVED" : "REJECTED";
  const result = await resolveLeave(numericId, decision, user.id, parsed.data.comment);

  if (!result.ok) {
    const statusMap: Record<string, { msg: string; code: number }> = {
      not_found: { msg: "Not found", code: 404 },
      already_resolved: { msg: "Leave already resolved", code: 400 },
      self_approval_disallowed: { msg: "Cannot approve your own leave request", code: 403 },
      forbidden: { msg: "You do not have permission to perform this action", code: 403 },
      not_final_approver: { msg: "Only the final approver can approve leave requests", code: 403 },
      balance_deduction_failed: { msg: "Insufficient leave balance", code: 400 },
    };

    const mapped = statusMap[result.error] || { msg: "Unexpected error", code: 500 };
    return NextResponse.json({ error: mapped.msg }, { status: mapped.code });
  }

  return NextResponse.json({
    ok: true,
    status: result.leave.status,
  });
}
