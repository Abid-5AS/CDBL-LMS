#!/usr/bin/env tsx
import "dotenv/config";

import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { LeaveService } from "@/lib/services/leave.service";
import { ApprovalService } from "@/lib/services/approval.service";
import { NotificationService } from "@/lib/services/notification.service";
import { Role, LeaveType } from "@prisma/client";

type CreatedEntities = {
  userIds: number[];
  employeeId?: number;
  leaveId?: number;
};

const noopNotification = async () => ({ success: true });
// Silence outbound notifications during verification runs
(NotificationService as any).notifyLeaveSubmitted = noopNotification;
(NotificationService as any).notifyLeaveForwarded = noopNotification;
(NotificationService as any).notifyLeaveApproved = noopNotification;

async function createUser(
  role: Role,
  overrides: Partial<Parameters<typeof prisma.user.create>[0]["data"]> = {}
) {
  const suffix = overrides.email ?? `workflow-${role}-${Date.now()}@spec.test`;
  const user = await prisma.user.create({
    data: {
      name: overrides.name ?? `${role} Workflow Bot`,
      email: suffix,
      password: overrides.password ?? "not-used",
      role,
      department: overrides.department ?? (role === Role.DEPT_HEAD ? "Ops" : undefined),
      joinDate: overrides.joinDate ?? addDays(new Date(), -400),
      ...overrides,
    },
  });
  return user;
}

async function seedBalances(userId: number, year: number) {
  await prisma.balance.createMany({
    data: [
      {
        userId,
        type: "CASUAL",
        year,
        opening: 5,
        accrued: 5,
        used: 0,
        closing: 10,
      },
      {
        userId,
        type: "EARNED",
        year,
        opening: 12,
        accrued: 12,
        used: 0,
        closing: 24,
      },
    ],
  });
}

async function cleanup({ userIds, employeeId, leaveId }: CreatedEntities) {
  if (leaveId) {
    await prisma.approval.deleteMany({ where: { leaveId } });
    await prisma.leaveRequest.deleteMany({ where: { id: leaveId } });
    await prisma.leaveVersion.deleteMany({ where: { leaveId } });
    await prisma.leaveComment.deleteMany({ where: { leaveId } });
  }
  if (employeeId) {
    await prisma.balance.deleteMany({ where: { userId: employeeId } });
  }
  if (userIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function runWorkflowCheck() {
  const created: CreatedEntities = { userIds: [] };

  try {
    const hrAdmin = await createUser(Role.HR_ADMIN);
    const deptHead = await createUser(Role.DEPT_HEAD);
    const hrHead = await createUser(Role.HR_HEAD);
    const ceo = await createUser(Role.CEO);
    const employee = await createUser(Role.EMPLOYEE, {
      deptHeadId: deptHead.id,
    });

    created.userIds.push(
      hrAdmin.id,
      deptHead.id,
      hrHead.id,
      ceo.id,
      employee.id
    );

    await prisma.user.update({
      where: { id: employee.id },
      data: { deptHeadId: deptHead.id },
    });

    const currentYear = new Date().getFullYear();
    created.employeeId = employee.id;
    await seedBalances(employee.id, currentYear);

    const leaveResult = await LeaveService.createLeaveRequest(employee.id, {
      type: LeaveType.CASUAL,
      startDate: addDays(new Date(), 7),
      endDate: addDays(new Date(), 9),
      reason: "Automated workflow verification",
    });

    if (!leaveResult.success || !leaveResult.data) {
      throw new Error(
        `Failed to create leave request: ${leaveResult.error?.message || "unknown error"}`
      );
    }

    const leaveId = leaveResult.data.id;
    created.leaveId = leaveId;

    const forwardChain: Array<[number, Role]> = [
      [hrAdmin.id, Role.DEPT_HEAD],
      [deptHead.id, Role.HR_HEAD],
      [hrHead.id, Role.CEO],
    ];

    for (const [actorId, nextRole] of forwardChain) {
      const forwardResult = await ApprovalService.forward(
        leaveId,
        actorId,
        nextRole,
        "Automated forward"
      );
      if (!forwardResult.success) {
        throw new Error(
          `Forward failed (${actorId} → ${nextRole}): ${forwardResult.error?.message}`
        );
      }
    }

    const approvalResult = await ApprovalService.approve(
      leaveId,
      ceo.id,
      "Automated final approval"
    );
    if (!approvalResult.success) {
      throw new Error(
        `Final approval failed: ${approvalResult.error?.message || "unknown error"}`
      );
    }

    const finalLeave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      select: { status: true },
    });

    if (finalLeave?.status !== "APPROVED") {
      throw new Error(
        `Leave did not reach APPROVED state (current: ${finalLeave?.status})`
      );
    }

    console.log(
      "✅ Approval workflow verified successfully:",
      `Leave ${leaveId} progressed HR Admin → Dept Head → HR Head → CEO`
    );
  } finally {
    await cleanup(created);
  }
}

runWorkflowCheck()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("❌ Approval workflow verification failed:", error);
    process.exitCode = 1;
  });
