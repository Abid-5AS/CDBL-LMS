import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@/src/generated/prisma/client";
import {
  canPerformAction,
  getStepForRole,
  getStatusAfterAction,
  isFinalApprover,
} from "@/lib/workflow";
import type { AppRole } from "@/lib/rbac";
import { deductBalance } from "@/lib/leaves/balance-manager";

type Decision = "APPROVED" | "REJECTED";

export async function resolveLeave(
  leaveId: number,
  decision: Decision,
  approverId: number,
  comment?: string
) {
  const approver = await prisma.user.findUnique({
    where: { id: approverId },
    select: { id: true, email: true, role: true, name: true },
  });

  if (!approver) {
    return { ok: false, error: "not_found" } as const;
  }

  const target = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      approvals: true,
      requester: { select: { name: true, email: true, role: true } },
    },
  });

  if (!target) {
    return { ok: false, error: "not_found" } as const;
  }

  if (target.requesterId === approverId) {
    return { ok: false, error: "self_approval_disallowed" } as const;
  }

  if (
    target.status !== LeaveStatus.SUBMITTED &&
    target.status !== LeaveStatus.PENDING
  ) {
    return {
      ok: false,
      error: "already_resolved",
      status: target.status,
    } as const;
  }

  const approverRole = approver.role as AppRole;
  const requesterRole = target.requester.role as AppRole;
  const action = decision === "APPROVED" ? "APPROVE" : "REJECT";

  if (!canPerformAction(approverRole, action, target.type, requesterRole)) {
    return { ok: false, error: "forbidden" } as const;
  }

  if (
    decision === "APPROVED" &&
    !isFinalApprover(approverRole, target.type, requesterRole)
  ) {
    return { ok: false, error: "not_final_approver" } as const;
  }

  const step = getStepForRole(approverRole, target.type, requesterRole);
  const newStatus = getStatusAfterAction(
    target.status as LeaveStatus,
    action
  );

  const existingApproval = await prisma.approval.findFirst({
    where: { leaveId, approverId, decision: "PENDING" },
  });

  if (existingApproval) {
    await prisma.approval.update({
      where: { id: existingApproval.id },
      data: { decision, decidedAt: new Date(), comment },
    });
  } else {
    await prisma.approval.create({
      data: {
        leaveId,
        step,
        approverId,
        decision,
        comment,
        decidedAt: new Date(),
      },
    });
  }

  if (decision === "APPROVED") {
    const currentYear = new Date().getFullYear();
    const deductionResult = await deductBalance(
      target.requesterId,
      target.type,
      target.workingDays,
      currentYear,
      target.id,
      { id: approver.id, email: approver.email, role: approverRole }
    );

    if (!deductionResult.success) {
      return {
        ok: false,
        error: "balance_deduction_failed",
        details: deductionResult.error,
      } as const;
    }
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: newStatus as LeaveStatus },
    include: {
      requester: { select: { name: true, email: true } },
      approvals: true,
    },
  });

  return { ok: true, leave: updated } as const;
}
