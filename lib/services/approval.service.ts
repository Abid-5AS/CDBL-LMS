import { ApprovalRepository, ApprovalWithRelations } from "@/lib/repositories/approval.repository";
import { LeaveRepository } from "@/lib/repositories/leave.repository";
import { NotificationService } from "./notification.service";
import { prisma } from "@/lib/prisma";
import { ApprovalDecision, LeaveStatus, Role } from "@prisma/client";

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};

/**
 * ApprovalService
 *
 * Handles all approval workflow business logic including:
 * - Approving/rejecting leave requests
 * - Forwarding approvals to next approver
 * - Managing approval chains
 * - Triggering notifications
 */
export class ApprovalService {
  /**
   * Get pending approvals for a specific approver
   */
  static async getPendingForApprover(approverId: number): Promise<ServiceResult<ApprovalWithRelations[]>> {
    try {
      const approvals = await ApprovalRepository.findPendingForApprover(approverId);
      return { success: true, data: approvals };
    } catch (error) {
      console.error("ApprovalService.getPendingForApprover error:", error);
      return {
        success: false,
        error: {
          code: "fetch_error",
          message: "Failed to fetch pending approvals",
        },
      };
    }
  }

  /**
   * Get approval history for an approver
   */
  static async getApprovalHistory(
    approverId: number,
    options?: {
      decision?: ApprovalDecision;
      limit?: number;
      offset?: number;
    }
  ): Promise<ServiceResult<ApprovalWithRelations[]>> {
    try {
      const approvals = await ApprovalRepository.findByApproverId(approverId, options);
      return { success: true, data: approvals };
    } catch (error) {
      console.error("ApprovalService.getApprovalHistory error:", error);
      return {
        success: false,
        error: {
          code: "fetch_error",
          message: "Failed to fetch approval history",
        },
      };
    }
  }

  /**
   * Get approval statistics for an approver
   */
  static async getApproverStats(approverId: number): Promise<ServiceResult<{
    pending: number;
    approved: number;
    rejected: number;
    forwarded: number;
    total: number;
  }>> {
    try {
      const stats = await ApprovalRepository.getApproverStats(approverId);
      return { success: true, data: stats };
    } catch (error) {
      console.error("ApprovalService.getApproverStats error:", error);
      return {
        success: false,
        error: {
          code: "fetch_error",
          message: "Failed to fetch approver statistics",
        },
      };
    }
  }

  /**
   * Approve a leave request
   */
  static async approve(
    leaveId: number,
    approverId: number,
    comment?: string
  ): Promise<ServiceResult<{ approved: boolean; isFinal: boolean }>> {
    try {
      // 1. Verify leave exists and is in valid state
      const leave = await LeaveRepository.findById(leaveId);
      if (!leave) {
        return {
          success: false,
          error: {
            code: "leave_not_found",
            message: "Leave request not found",
          },
        };
      }

      if (!["PENDING", "SUBMITTED"].includes(leave.status)) {
        return {
          success: false,
          error: {
            code: "invalid_status",
            message: `Cannot approve leave in ${leave.status} status`,
          },
        };
      }

      // 2. Find and update the pending approval
      const updated = await ApprovalRepository.updateByLeaveAndApprover(
        leaveId,
        approverId,
        "APPROVED",
        comment
      );

      if (updated === 0) {
        return {
          success: false,
          error: {
            code: "approval_not_found",
            message: "No pending approval found for this approver",
          },
        };
      }

      // 3. Check if this is the final approval
      const isFinal = await this.isFinalApproval(leaveId);

      // 4. Update leave status
      if (isFinal) {
        await LeaveRepository.updateStatus(leaveId, "APPROVED");

        // Deduct from balance
        await this.deductFromBalance(leave.requesterId, leave.type, leave.workingDays);
      }

      // 5. Log the approval
      await this.logAction(
        approverId,
        "LEAVE_APPROVED",
        `Approved leave request ${leaveId}`,
        { leaveId, comment, isFinal }
      );

      // 6. Send notifications (only on final approval)
      if (isFinal) {
        const approver = await prisma.user.findUnique({
          where: { id: approverId },
          select: { name: true },
        });
        if (approver) {
          await NotificationService.notifyLeaveApproved(leaveId, approver.name);
        }
      }

      return {
        success: true,
        data: { approved: true, isFinal },
      };
    } catch (error) {
      console.error("ApprovalService.approve error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "Failed to approve leave request",
        },
      };
    }
  }

  /**
   * Reject a leave request
   */
  static async reject(
    leaveId: number,
    approverId: number,
    reason: string
  ): Promise<ServiceResult<{ rejected: boolean }>> {
    try {
      if (!reason || reason.trim().length === 0) {
        return {
          success: false,
          error: {
            code: "reason_required",
            message: "Rejection reason is required",
          },
        };
      }

      // 1. Verify leave exists
      const leave = await LeaveRepository.findById(leaveId);
      if (!leave) {
        return {
          success: false,
          error: {
            code: "leave_not_found",
            message: "Leave request not found",
          },
        };
      }

      // 2. Update approval record
      const updated = await ApprovalRepository.updateByLeaveAndApprover(
        leaveId,
        approverId,
        "REJECTED",
        reason
      );

      if (updated === 0) {
        return {
          success: false,
          error: {
            code: "approval_not_found",
            message: "No pending approval found for this approver",
          },
        };
      }

      // 3. Update leave status to REJECTED
      await LeaveRepository.updateStatus(leaveId, "REJECTED");

      // 4. Log the rejection
      await this.logAction(
        approverId,
        "LEAVE_REJECTED",
        `Rejected leave request ${leaveId}`,
        { leaveId, reason }
      );

      // 5. Send notification to requester
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
        select: { name: true },
      });
      if (approver) {
        await NotificationService.notifyLeaveRejected(leaveId, approver.name, reason);
      }

      return {
        success: true,
        data: { rejected: true },
      };
    } catch (error) {
      console.error("ApprovalService.reject error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "Failed to reject leave request",
        },
      };
    }
  }

  /**
   * Forward a leave request to the next approver
   */
  static async forward(
    leaveId: number,
    currentApproverId: number,
    nextApproverRole: Role,
    comment?: string
  ): Promise<ServiceResult<{ forwarded: boolean }>> {
    try {
      // 1. Verify leave exists
      const leave = await LeaveRepository.findById(leaveId);
      if (!leave) {
        return {
          success: false,
          error: {
            code: "leave_not_found",
            message: "Leave request not found",
          },
        };
      }

      // 2. Find next approver
      const nextApprover = await prisma.user.findFirst({
        where: { role: nextApproverRole },
        select: { id: true, name: true },
      });

      if (!nextApprover) {
        return {
          success: false,
          error: {
            code: "approver_not_found",
            message: `No ${nextApproverRole} found to forward to`,
          },
        };
      }

      // 3. Update current approval to FORWARDED
      const updated = await ApprovalRepository.updateByLeaveAndApprover(
        leaveId,
        currentApproverId,
        "FORWARDED",
        comment
      );

      if (updated === 0) {
        return {
          success: false,
          error: {
            code: "approval_not_found",
            message: "No pending approval found for this approver",
          },
        };
      }

      // 4. Create new approval for next approver
      const nextStep = await ApprovalRepository.getNextStep(leaveId);
      await ApprovalRepository.create({
        leaveId,
        approverId: nextApprover.id,
        step: nextStep,
        decision: "PENDING",
      });

      // 5. Update leave status - keep as PENDING since it's still being processed
      await LeaveRepository.updateStatus(leaveId, "PENDING");

      // 6. Log the forward action
      await this.logAction(
        currentApproverId,
        "LEAVE_FORWARDED",
        `Forwarded leave request ${leaveId} to ${nextApproverRole}`,
        { leaveId, toRole: nextApproverRole, comment }
      );

      // 7. Send notifications
      const forwarder = await prisma.user.findUnique({
        where: { id: currentApproverId },
        select: { name: true },
      });
      if (forwarder) {
        await NotificationService.notifyLeaveForwarded(leaveId, nextApprover.id, forwarder.name);
      }

      return {
        success: true,
        data: { forwarded: true },
      };
    } catch (error) {
      console.error("ApprovalService.forward error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "Failed to forward leave request",
        },
      };
    }
  }

  /**
   * Return a leave request for modification
   */
  static async returnForModification(
    leaveId: number,
    approverId: number,
    reason: string
  ): Promise<ServiceResult<{ returned: boolean }>> {
    try {
      if (!reason || reason.trim().length === 0) {
        return {
          success: false,
          error: {
            code: "reason_required",
            message: "Return reason is required",
          },
        };
      }

      // 1. Verify leave exists
      const leave = await LeaveRepository.findById(leaveId);
      if (!leave) {
        return {
          success: false,
          error: {
            code: "leave_not_found",
            message: "Leave request not found",
          },
        };
      }

      // 2. Update approval record (mark as RETURNED but keep as special case)
      const updated = await ApprovalRepository.updateByLeaveAndApprover(
        leaveId,
        approverId,
        "PENDING", // Keep as PENDING so it can be reprocessed after modification
        `RETURNED: ${reason}`
      );

      if (updated === 0) {
        return {
          success: false,
          error: {
            code: "approval_not_found",
            message: "No pending approval found for this approver",
          },
        };
      }

      // 3. Update leave status to RETURNED
      await LeaveRepository.updateStatus(leaveId, "RETURNED");

      // 4. Log the return action
      await this.logAction(
        approverId,
        "LEAVE_RETURNED",
        `Returned leave request ${leaveId} for modification`,
        { leaveId, reason }
      );

      // 5. Send notification to requester
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
        select: { name: true },
      });
      if (approver) {
        await NotificationService.notifyLeaveReturned(leaveId, approver.name, reason);
      }

      return {
        success: true,
        data: { returned: true },
      };
    } catch (error) {
      console.error("ApprovalService.returnForModification error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "Failed to return leave request",
        },
      };
    }
  }

  /**
   * Bulk approve multiple leave requests
   */
  static async bulkApprove(
    leaveIds: number[],
    approverId: number,
    comment?: string
  ): Promise<ServiceResult<{ successCount: number; failedIds: number[] }>> {
    try {
      let successCount = 0;
      const failedIds: number[] = [];

      for (const leaveId of leaveIds) {
        const result = await this.approve(leaveId, approverId, comment);
        if (result.success) {
          successCount++;
        } else {
          failedIds.push(leaveId);
        }
      }

      return {
        success: true,
        data: { successCount, failedIds },
      };
    } catch (error) {
      console.error("ApprovalService.bulkApprove error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "Failed to bulk approve leave requests",
        },
      };
    }
  }

  // ===== Private Helper Methods =====

  /**
   * Check if all approvals are completed and approved (final approval)
   */
  private static async isFinalApproval(leaveId: number): Promise<boolean> {
    return await ApprovalRepository.areAllApprovalsApproved(leaveId);
  }

  /**
   * Deduct leave days from user's balance
   */
  private static async deductFromBalance(
    userId: number,
    leaveType: string,
    days: number
  ): Promise<void> {
    const currentYear = new Date().getFullYear();

    // Find or create balance record
    const balance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId,
          type: leaveType as any,
          year: currentYear,
        },
      },
    });

    if (balance) {
      await prisma.balance.update({
        where: { id: balance.id },
        data: {
          used: balance.used + days,
          closing: (balance.opening + balance.accrued) - (balance.used + days),
        },
      });
    }
  }

  /**
   * Log approval action to audit log
   */
  private static async logAction(
    actorId: number,
    action: string,
    description: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { email: true },
      });

      if (actor) {
        await prisma.auditLog.create({
          data: {
            actorEmail: actor.email,
            action,
            details: {
              description,
              ...details,
            },
          },
        });
      }
    } catch (error) {
      console.error("Failed to log approval action:", error);
      // Don't throw - logging failure shouldn't block the operation
    }
  }
}
