import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import {
  EncashmentRequestSchema,
  EncashmentServiceError,
  createEncashmentRequest,
  listEncashmentRequests,
} from "@/lib/services/encashment.service";
import { NextRequest } from "next/server";

export const cache = "no-store";

/**
 * GET /api/encashment - List encashment requests
 * - Employees see their own requests
 * - Admins/HR/CEO see all requests filtered by status
 */
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  const traceId = getTraceId(req as any);
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  const statusFilter = req.nextUrl.searchParams.get("status"); // PENDING, APPROVED, REJECTED, PAID

  try {
    const requests = await listEncashmentRequests(me, { status: statusFilter });
    return NextResponse.json({ requests });
  } catch (err) {
    return NextResponse.json(
      error(
        "encashment_list_failed",
        err instanceof Error ? err.message : "Failed to load encashment requests",
        traceId
      ),
      { status: 500 }
    );
  }
}

/**
 * POST /api/encashment - Create EL encashment request
 * Policy 6.19.f: Employees can encash EL balance exceeding 10 days
 */
export async function POST(req: NextRequest) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  const json = await req.json();
  const parsedInput = EncashmentRequestSchema.parse(json);

  try {
    const result = await createEncashmentRequest(me, parsedInput);
    return NextResponse.json({
      ok: true,
      request: result.request,
      remainingBalance: result.remainingBalance,
    });
  } catch (err) {
    if (err instanceof EncashmentServiceError) {
      return NextResponse.json(
        error(err.code, err.message, traceId, err.details as any),
        { status: err.status }
      );
    }

    return NextResponse.json(
      error(
        "encashment_create_failed",
        err instanceof Error ? err.message : "Failed to submit encashment",
        traceId
      ),
      { status: 500 }
    );
  }
}
