import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";

type Decision = "APPROVED" | "REJECTED";

export async function resolveLeave(leaveId: number, decision: Decision, approverId: number, comment?: string) {
  const target = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { approvals: true },
  });

  if (!target) {
    return { ok: false, error: "not_found" } as const;
  }

  if (target.status !== LeaveStatus.SUBMITTED && target.status !== LeaveStatus.PENDING) {
    return { ok: false, error: "already_resolved", status: target.status } as const;
  }

  await prisma.approval.deleteMany({ where: { leaveId } }).catch(() => undefined);

  await prisma.approval.create({
    data: {
      leaveId,
      step: 1,
      approverId,
      decision,
      comment,
      decidedAt: new Date(),
    },
  });

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: decision,
    },
    include: {
      requester: { select: { name: true, email: true } },
      approvals: true,
    },
  });

  return { ok: true, leave: updated } as const;
}
