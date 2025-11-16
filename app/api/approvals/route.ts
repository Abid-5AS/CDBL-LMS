import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApprovalService } from "@/lib/services/approval.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { LeaveStatus } from "@prisma/client";

// Short cache for pending approvals (30 seconds)
let approvalCache: Map<number, { data: any; timestamp: number }> = new Map();
const APPROVAL_CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * GET /api/approvals
 *
 * Fetch pending approvals for the current user
 * With short-lived caching for improved performance
 */
export async function GET(req: Request) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();

  // Verify user is an approver
  if (!me || !["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"].includes(me.role)) {
    return NextResponse.json(
      error(
        "forbidden",
        "You don't have permission to view approvals",
        traceId
      ),
      { status: 403 }
    );
  }

  // Check cache first
  const now = Date.now();
  const cached = approvalCache.get(me.id);
  if (cached && now - cached.timestamp < APPROVAL_CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  }

  try {
    // Use ApprovalService to get pending approvals
    const result = await ApprovalService.getPendingForApprover(me.id);

    if (!result.success) {
      return NextResponse.json(
        error(result.error!.code, result.error!.message, traceId),
        { status: 500 }
      );
    }

    // Transform approvals to serialized format for frontend
    const items = (result.data || []).map((approval) => ({
      id: String(approval.leave.id),
      type: approval.leave.type,
      start: approval.leave.startDate.toISOString(),
      end: approval.leave.endDate.toISOString(),
      startDate: approval.leave.startDate.toISOString(),
      endDate: approval.leave.endDate.toISOString(),
      workingDays: approval.leave.workingDays,
      requestedDays: approval.leave.workingDays,
      reason: approval.leave.reason,
      status: approval.leave.status,
      isModified: (approval.leave as any).isModified ?? false,
      approvals: [
        {
          role: approval.approver.role,
          status: approval.decision,
          decision: approval.decision,
          toRole: approval.toRole,
          decidedById: approval.approverId ? String(approval.approverId) : null,
          decidedByName: approval.approver.name,
          decidedAt: approval.decidedAt
            ? approval.decidedAt.toISOString()
            : null,
          comment: approval.comment,
        },
      ],
      currentStageIndex: approval.step - 1,
      requestedById: String(approval.leave.requesterId),
      requestedByName: approval.leave.requester.name,
      requestedByEmail: approval.leave.requester.email,
      requester: {
        id: approval.leave.requesterId,
        name: approval.leave.requester.name,
        email: approval.leave.requester.email,
      },
      updatedAt: approval.leave.updatedAt.toISOString(),
      createdAt: approval.leave.createdAt.toISOString(),
    }));

    const responseData = { items };

    // Update cache
    approvalCache.set(me.id, {
      data: responseData,
      timestamp: Date.now(),
    });

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("GET /api/approvals error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to fetch approvals", traceId),
      { status: 500 }
    );
  }
}

// Clear cache on write operations
export function clearApprovalCache(userId?: number) {
  if (userId) {
    approvalCache.delete(userId);
  } else {
    approvalCache.clear();
  }
}
