import { prisma } from "@/lib/prisma";
import { ApprovalDecision, Role } from "@prisma/client";
import { addHours, isBefore } from "date-fns";

export class EscalationService {
  /**
   * Check for overdue approvals and escalate them based on rules
   */
  static async checkOverdueApprovals() {
    // 1. Get all active escalation rules
    const rules = await prisma.escalationRule.findMany({
      where: { isActive: true },
    });

    if (rules.length === 0) return { escalatedCount: 0 };

    let escalatedCount = 0;

    // 2. For each rule, find pending approvals that match the criteria
    for (const rule of rules) {
      // Find approvals pending at the current step where the approver has the matching role
      // AND the time elapsed exceeds the timeout
      
      // Note: This logic assumes we can identify the role of the current approver from the Approval record
      // or by joining with the User table.
      
      const timeoutThreshold = addHours(new Date(), -rule.timeoutHours);

      const overdueApprovals = await prisma.approval.findMany({
        where: {
          decision: "PENDING",
          // Created before the threshold (meaning it's been pending longer than timeout)
          // We use `decidedAt` for completion, but for pending duration we should look at when it was created?
          // The Approval model doesn't have `createdAt`. It relies on `LeaveRequest.createdAt` or previous step completion.
          // However, for simplicity, let's assume we check against `LeaveRequest.updatedAt` if it's the first step,
          // or we need to add `createdAt` to Approval model.
          // 
          // Let's check schema again. Approval has no createdAt.
          // But LeaveRequest has updatedAt.
          // If we want precise tracking, we should add createdAt to Approval.
          // For now, let's use LeaveRequest.updatedAt as a proxy for when the current step started
          // (since moving to next step updates the leave).
          leave: {
            updatedAt: {
              lte: timeoutThreshold,
            },
            status: "PENDING",
          },
          approver: {
            role: rule.role,
          },
        },
        include: {
          leave: true,
          approver: true,
        },
      });

      for (const approval of overdueApprovals) {
        await this.escalateApproval(approval.id, rule.escalateToRole);
        escalatedCount++;
      }
    }

    return { escalatedCount };
  }

  /**
   * Escalate a specific approval to a new role
   */
  static async escalateApproval(approvalId: number, targetRole: Role) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { leave: true },
    });

    if (!approval) return;

    // 1. Find a user with the target role to escalate to
    // Ideally, this should be the specific manager's manager, or a generic role holder (e.g. HR Head)
    // For simplicity, we'll pick the first user with that role, or the department head if applicable.
    
    let newApprover = await prisma.user.findFirst({
      where: { role: targetRole },
    });

    // If escalating to DEPT_HEAD, try to find the specific department head of the requester
    if (targetRole === "DEPT_HEAD") {
      const requester = await prisma.user.findUnique({
        where: { id: approval.leave.requesterId },
        include: { deptHead: true },
      });
      if (requester?.deptHead) {
        newApprover = requester.deptHead;
      }
    }

    if (!newApprover) {
      console.warn(`No user found for escalation role: ${targetRole}`);
      return;
    }

    // 2. Update the approval record
    // We can either update the existing approval or create a new one.
    // Updating is cleaner for the current schema structure.
    // We'll mark the original approver as "skipped/escalated" in comments maybe?
    
    await prisma.$transaction(async (tx) => {
      // Update the approval to the new approver
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          approverId: newApprover.id,
          // We might want to track that this was escalated.
          // Since we don't have a specific field, we can append to the comment or use a separate log.
          comment: `[System] Auto-escalated from ${approval.approverId} to ${newApprover.id} due to timeout.`,
        },
      });

      // Log to audit trail
      await tx.auditLog.create({
        data: {
          action: "APPROVAL_ESCALATED",
          actorEmail: "system",
          targetEmail: newApprover.email,
          details: {
            leaveId: approval.leaveId,
            originalApproverId: approval.approverId,
            newApproverId: newApprover.id,
            reason: "Timeout",
          },
        },
      });

      // Create notification for new approver
      await tx.notification.create({
        data: {
          userId: newApprover.id,
          type: "APPROVAL_REQUIRED",
          title: "Escalated Approval Required",
          message: `A leave request has been escalated to you for approval.`,
          leaveId: approval.leaveId,
          link: `/approvals`,
        },
      });
    });
  }
}
