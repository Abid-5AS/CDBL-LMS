import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

const ApprovalSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

/**
 * POST /api/encashment/[id]/approve - Approve or reject encashment request
 * Only CEO and HR_HEAD can approve encashment requests
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();
  if (!me) return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });

  // Only CEO and HR_HEAD can approve encashment
  if (me.role !== "CEO" && me.role !== "HR_HEAD") {
    return NextResponse.json(
      error(
        "insufficient_permissions",
        "Only CEO or HR Head can approve encashment requests.",
        traceId
      ),
      { status: 403 }
    );
  }

  const encashmentId = parseInt(id);
  if (isNaN(encashmentId)) {
    return NextResponse.json(error("invalid_id", undefined, traceId), { status: 400 });
  }

  const json = await req.json();
  const parsedInput = ApprovalSchema.parse(json);

  // Get encashment request
  const encashmentRequest = await prisma.encashmentRequest.findUnique({
    where: { id: encashmentId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!encashmentRequest) {
    return NextResponse.json(
      error("encashment_not_found", undefined, traceId),
      { status: 404 }
    );
  }

  if (encashmentRequest.status !== "PENDING") {
    return NextResponse.json(
      error(
        "encashment_already_processed",
        `This encashment request has already been ${encashmentRequest.status.toLowerCase()}.`,
        traceId,
        { currentStatus: encashmentRequest.status }
      ),
      { status: 400 }
    );
  }

  if (parsedInput.decision === "REJECTED" && !parsedInput.rejectionReason) {
    return NextResponse.json(
      error("rejection_reason_required", "Please provide a reason for rejection.", traceId),
      { status: 400 }
    );
  }

  // Update encashment request status
  const updated = await prisma.encashmentRequest.update({
    where: { id: encashmentId },
    data: {
      status: parsedInput.decision,
      approvedBy: me.id,
      approvedAt: new Date(),
      rejectionReason: parsedInput.rejectionReason,
    },
  });

  // If approved, deduct from EL balance
  if (parsedInput.decision === "APPROVED") {
    const elBalance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: encashmentRequest.userId,
          type: "EARNED",
          year: encashmentRequest.year,
        },
      },
    });

    if (elBalance) {
      // Deduct encashed days from used column (increases usage)
      const newUsed = (elBalance.used ?? 0) + encashmentRequest.daysRequested;
      const newClosing = (elBalance.opening ?? 0) + (elBalance.accrued ?? 0) - newUsed;

      await prisma.balance.update({
        where: { id: elBalance.id },
        data: {
          used: newUsed,
          closing: newClosing,
        },
      });
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorEmail: me.email,
      action: `ENCASHMENT_${parsedInput.decision}`,
      targetEmail: encashmentRequest.user.email,
      details: {
        encashmentId: encashmentRequest.id,
        year: encashmentRequest.year,
        daysRequested: encashmentRequest.daysRequested,
        decision: parsedInput.decision,
        rejectionReason: parsedInput.rejectionReason,
        approverRole: me.role,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    encashmentRequest: updated,
  });
}
