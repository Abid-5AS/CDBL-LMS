import { NextResponse } from "next/server";
import { ApprovalDecision } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { ApprovalService } from "@/lib/services/approval.service";

const APPROVER_ROLES = new Set(["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]);
const VALID_DECISIONS = new Set<ApprovalDecision | "ALL">([
  "ALL",
  "APPROVED",
  "REJECTED",
  "FORWARDED",
]);

export async function GET(req: Request) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json(error("unauthorized", undefined, traceId), {
      status: 401,
    });
  }

  if (!APPROVER_ROLES.has(me.role)) {
    return NextResponse.json(
      error("forbidden", "You don't have permission to view approvals", traceId),
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const decisionParam = (searchParams.get("decision") || "ALL")
    .toUpperCase()
    .trim();
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "25", 10) || 25, 1),
    100
  );
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
  const offset = (page - 1) * limit;

  if (!VALID_DECISIONS.has(decisionParam as ApprovalDecision | "ALL")) {
    return NextResponse.json(
      error("invalid_filter", "Unsupported decision filter", traceId),
      { status: 400 }
    );
  }

  const decision =
    decisionParam === "ALL"
      ? undefined
      : (decisionParam as ApprovalDecision);

  const result = await ApprovalService.getApprovalHistory(me.id, {
    decision,
    limit,
    offset,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error?.code || "fetch_error", result.error?.message, traceId),
      { status: 500 }
    );
  }

  const items =
    result.data?.map((approval) => ({
      id: String(approval.leave.id),
      type: approval.leave.type,
      start: approval.leave.startDate.toISOString(),
      end: approval.leave.endDate.toISOString(),
      requestedDays: approval.leave.workingDays,
      reason: approval.leave.reason,
      status: approval.decision,
      approvals: [
        {
          role: approval.approver.role,
          status: approval.decision,
          decidedByName: approval.approver.name,
          decidedAt: approval.decidedAt
            ? approval.decidedAt.toISOString()
            : null,
          comment: approval.comment,
        },
      ],
      currentStageIndex: approval.step - 1,
      requestedById: String(approval.leave.requester.id),
      requestedByName: approval.leave.requester.name,
      requestedByEmail: approval.leave.requester.email,
    })) ?? [];

  return NextResponse.json(
    {
      items,
      page,
      pageSize: limit,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    }
  );
}
