import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * GET /api/manager/pending
 *
 * Fetch team leave requests for department heads with filters and pagination
 * This endpoint is role-aware and only accessible by DEPT_HEAD users
 */
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req as any);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(error("unauthorized", undefined, traceId), {
        status: 401,
      });
    }

    if (user.role !== "DEPT_HEAD") {
      return NextResponse.json(
        error("forbidden", "Only Department Heads can access this endpoint", traceId),
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filters = {
      search: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("size") ?? 10),
    };

    // Delegate to LeaveService
    const result = await LeaveService.getTeamLeaveRequests(user.id, filters);

    if (!result.success) {
      return NextResponse.json(
        error(result.error!.code, result.error!.message, traceId),
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (err: any) {
    console.error("Error in /api/manager/pending:", err);
    return NextResponse.json(
      error("server_error", err?.message || "Failed to fetch pending requests", traceId),
      { status: 500 }
    );
  }
}

