import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { validateELEncashment } from "@/lib/policy";

export const cache = "no-store";

const EncashmentRequestSchema = z.object({
  daysRequested: z.number().int().positive(),
  reason: z.string().optional(),
});

/**
 * GET /api/encashment - List encashment requests
 * - Employees see their own requests
 * - Admins/HR/CEO see all requests filtered by status
 */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  const traceId = getTraceId(req as any);
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status"); // PENDING, APPROVED, REJECTED, PAID

  const where: any = {};

  // Employees can only see their own requests
  // HR/CEO can see all requests
  if (me.role === "EMPLOYEE" || me.role === "DEPT_HEAD") {
    where.userId = me.id;
  }

  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  const requests = await prisma.encashmentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          empCode: true,
          department: true,
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({ requests });
}

/**
 * POST /api/encashment - Create EL encashment request
 * Policy 6.19.f: Employees can encash EL balance exceeding 10 days
 */
export async function POST(req: Request) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  const json = await req.json();
  const parsedInput = EncashmentRequestSchema.parse(json);

  const currentYear = new Date().getFullYear();

  // Get current EL balance
  const elBalance = await prisma.balance.findUnique({
    where: {
      userId_type_year: {
        userId: me.id,
        type: "EARNED",
        year: currentYear,
      },
    },
  });

  if (!elBalance) {
    return NextResponse.json(
      error(
        "no_el_balance",
        "You don't have an EL balance record for this year. Please contact HR.",
        traceId
      ),
      { status: 404 }
    );
  }

  // Calculate current balance
  const currentBalance = (elBalance.opening ?? 0) + (elBalance.accrued ?? 0) - (elBalance.used ?? 0);

  // Validate encashment request
  const validation = validateELEncashment(currentBalance, parsedInput.daysRequested);

  if (!validation.valid) {
    return NextResponse.json(
      error("encashment_validation_failed", validation.reason, traceId, {
        currentBalance,
        requested: parsedInput.daysRequested,
        maxEncashable: validation.maxEncashable,
      }),
      { status: 400 }
    );
  }

  // Check if there's already a pending encashment request for this year
  const existingPending = await prisma.encashmentRequest.findFirst({
    where: {
      userId: me.id,
      year: currentYear,
      status: "PENDING",
    },
  });

  if (existingPending) {
    return NextResponse.json(
      error(
        "encashment_already_pending",
        "You already have a pending encashment request for this year. Please wait for it to be processed.",
        traceId,
        { existingRequestId: existingPending.id }
      ),
      { status: 400 }
    );
  }

  // Create encashment request
  const encashmentRequest = await prisma.encashmentRequest.create({
    data: {
      userId: me.id,
      year: currentYear,
      daysRequested: parsedInput.daysRequested,
      balanceAtRequest: currentBalance,
      reason: parsedInput.reason,
      status: "PENDING",
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: me.email,
      action: "ENCASHMENT_REQUESTED",
      targetEmail: me.email,
      details: {
        encashmentId: encashmentRequest.id,
        year: currentYear,
        daysRequested: parsedInput.daysRequested,
        balanceAtRequest: currentBalance,
        remainingBalance: validation.remainingBalance,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    request: encashmentRequest,
    remainingBalance: validation.remainingBalance,
  });
}
