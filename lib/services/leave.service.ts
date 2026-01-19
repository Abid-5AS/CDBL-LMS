/**
 * Leave Service
 * Orchestrates business logic for leave management
 */

import { LeaveType, LeaveStatus, ApprovalDecision, Role } from "@/src/generated/prisma/client";
import { LeaveRepository } from "@/lib/repositories/leave.repository";
import { LeaveValidator } from "./leave-validator";
import { NotificationService } from "./notification.service";
import { prisma } from "@/lib/prisma";
import { notifyLeaveSubmitted } from "@/lib/webhooks/events";
import { daysInclusive } from "@/lib/policy";
import { getStepForRole } from "@/lib/workflow";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { generateSignedUrl } from "@/lib/storage";
import { ApprovalService } from "./approval.service";
import { LeaveQueryService } from "./leave-query.service";

export type CreateLeaveRequestDTO = {
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  workingDays?: number;
  needsCertificate?: boolean;
  certificateFile?: File;
  incidentDate?: Date; // For Special Disability Leave - when the disabling incident occurred
  isHalfDay?: boolean;
  halfDayPeriod?: "AM" | "PM";
};

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};

export class LeaveService {
  /**
   * Create a new leave request.
   * 
   * Validates the request against policy rules, uploads any required certificates,
   * creates the leave record, initiates the approval workflow, and sends notifications.
   * 
   * @param userId - The ID of the user requesting leave
   * @param dto - Data transfer object containing leave details
   * @returns ServiceResult containing the created leave request or error details
   */
  static async createLeaveRequest(
    userId: number,
    dto: CreateLeaveRequestDTO
  ): Promise<ServiceResult<any>> {
    try {
      // 1. Parallelize initial checks and uploads
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const [existingRequest, user, certificateResult] = await Promise.all([
        // Check duplicate
        prisma.leaveRequest.findFirst({
          where: {
            requesterId: userId,
            type: dto.type,
            startDate: dto.startDate,
            endDate: dto.endDate,
            reason: dto.reason,
            createdAt: { gte: fiveMinutesAgo },
          },
          orderBy: { createdAt: "desc" },
        }),
        // Get user info
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            role: true,
            joinDate: true,
            retirementDate: true,
            deptHeadId: true,
          },
        }),
        // Upload certificate
        dto.certificateFile
          ? this.uploadCertificate(dto.certificateFile)
          : Promise.resolve({ success: true, data: undefined } as ServiceResult<string>),
      ]);

      if (existingRequest) {
        return {
          success: true,
          data: existingRequest,
        };
      }

      if (!user || !user.joinDate) {
        return {
          success: false,
          error: {
            code: "user_not_found",
            message: "Employee record not found or incomplete",
          },
        };
      }

      if (!certificateResult.success) {
        return {
          success: false,
          error: certificateResult.error,
        };
      }
      const certificateUrl = certificateResult.data;

      // 3. Calculate working days if not provided
      const workingDays =
        dto.workingDays || daysInclusive(dto.startDate, dto.endDate);

      // 5. Validate leave request
      const validation = await LeaveValidator.validateLeaveRequest({
        userId,
        type: dto.type,
        startDate: dto.startDate,
        endDate: dto.endDate,
        workingDays,
        joinDate: user.joinDate,
        retirementDate: user.retirementDate,
        certificateFile: dto.certificateFile,
        incidentDate: dto.incidentDate,
      });

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // 6. Extract pay calculation for Special Disability Leave
      let payCalculation: any = undefined;
      if (
        dto.type === "SPECIAL_DISABILITY" &&
        validation.warning?.details?.payCalculation
      ) {
        payCalculation = validation.warning.details.payCalculation;
      }

      // 7. Transactional Creation
      const { leaveRequest, approverIds } = await prisma.$transaction(async (tx) => {
        // 7.1 Create leave request
        const leaveRequest = await tx.leaveRequest.create({
          data: {
            requesterId: userId,
            type: dto.type,
            status: LeaveStatus.PENDING, // Explicitly PENDING initially
            policyVersion: "v2.0",       // Default policy version
            startDate: dto.startDate,
            endDate: dto.endDate,
            workingDays,
            reason: dto.reason,
            certificateUrl,
            needsCertificate: dto.needsCertificate,
            incidentDate: dto.incidentDate,
            payCalculation: payCalculation,
            isHalfDay: dto.isHalfDay ?? false,
            halfDayPeriod: dto.halfDayPeriod,
          },
        });

        // 7.2 Create full approval chain (Snapshotting)
        const { WorkflowService } = await import('@/lib/workflow-service');
        const chain = await WorkflowService.getChainFor(user.role as any, dto.type);

        const createdApproverIds: number[] = [];

        if (chain.length > 0) {
          for (let i = 0; i < chain.length; i++) {
            const role = chain[i];
            const step = i + 1;
            const approver = await LeaveService.findApprover(userId, role);

            if (approver) {
              await tx.approval.create({
                data: {
                  leaveId: leaveRequest.id,
                  approverId: approver.id,
                  step: step,
                  decision: ApprovalDecision.PENDING,
                },
              });
              createdApproverIds.push(approver.id);
            } else {
              console.warn(`Snapshotting halted: No approver found for role ${role} (request ${leaveRequest.id})`);
              // For now, we allow the chain to be incomplete
            }
          }
        }

        // 7.3 Log the creation
        await tx.auditLog.create({
          data: {
            actorEmail: user.email,
            action: "LEAVE_CREATED",
            targetEmail: user.email,
            details: { leaveId: leaveRequest.id }
          }
        });

        return { leaveRequest, approverIds: createdApproverIds };
      });

      // 8. Send Notifications (Post-transaction)
      try {
        // Notify Requester
        await NotificationService.notifyLeaveSubmitted(leaveRequest.id, userId); // Or similar helper

        // Notify First Approver
        // We need to find the first step (which is approverIds[0] if ordered, but safest to query or use list)
        // Actually, we have approverIds collected in order of chain.
        // Chain order is correct (step 1, step 2...)
        if (approverIds.length > 0) {
          await NotificationService.notifyLeaveForwarded(leaveRequest.id, approverIds[0], user.email);
        }
      } catch (e) {
        console.error("Failed to send notifications", e);
      }

      // 9. Trigger webhook notification (non-blocking)
      try {
        await notifyLeaveSubmitted({
          leaveId: leaveRequest.id,
          employeeId: userId,
          employeeName: user.email.split('@')[0],
          employeeEmail: user.email,
          leaveType: dto.type,
          startDate: dto.startDate,
          endDate: dto.endDate,
          workingDays: workingDays,
          reason: dto.reason,
          status: 'SUBMITTED',
        });

        // 10. Dispatch Webhook Event
        const { WebhookService } = await import("./webhook.service");
        await WebhookService.dispatch('leave.created', {
          leaveId: leaveRequest.id,
          userId: userId,
          leaveType: dto.type,
          startDate: dto.startDate,
          endDate: dto.endDate,
          status: 'SUBMITTED',
          reason: dto.reason,
        });
      } catch (webhookError) {
        console.error("Webhook dispatch failed (non-critical):", webhookError);
        // Don't fail the request because of webhook failure
      }

      return {
        success: true,
        data: leaveRequest,
      };
    } catch (error) {
      console.error("LeaveService.createLeaveRequest error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred while creating leave request",
        },
      };
    }
  }

  /**
   * Approve a leave request.
   * 
   * Updates the approval status, checks if it's the final approval,
   * and if so, updates the leave status and deducts balance.
   * 
   * @param leaveId - ID of the leave request
   * @param approverId - ID of the user approving the request
   * @param comment - Optional comment from the approver
   * @returns ServiceResult indicating success or failure
   */
  static async approveLeave(
    leaveId: number,
    approverId: number,
    comment?: string,
    ignoreWarnings: boolean = false
  ): Promise<ServiceResult<any>> {
    // Check for capacity conflicts before approving
    if (!ignoreWarnings) {
      const leave = await LeaveRepository.findById(leaveId);
      if (leave && leave.requester.department) {
        const { TeamCapacityService } = await import("./team-capacity.service");
        const conflict = await TeamCapacityService.checkConflicts(
          leave.requester.department,
          leave.startDate,
          leave.endDate
        );

        if (conflict.hasConflict) {
          return {
            success: false,
            error: {
              code: "capacity_conflict",
              message: conflict.message || "Capacity conflict detected",
              details: { conflictDays: conflict.conflictDays },
            },
          };
        }
      }
    }

    return ApprovalService.approve(leaveId, approverId, comment);
  }

  /**
   * Reject a leave request.
   * 
   * Updates the approval status to REJECTED, updates the leave status to REJECTED,
   * and notifies the requester.
   * 
   * @param leaveId - ID of the leave request
   * @param approverId - ID of the user rejecting the request
   * @param reason - Reason for rejection
   * @returns ServiceResult indicating success or failure
   */
  static async rejectLeave(
    leaveId: number,
    approverId: number,
    reason: string
  ): Promise<ServiceResult<any>> {
    return ApprovalService.reject(leaveId, approverId, reason);
  }

  /**
   * Forward a leave request to the next approver in the chain.
   * 
   * @param leaveId - ID of the leave request
   * @param currentApproverId - ID of the current approver forwarding the request
   * @param comment - Optional comment
   * @returns ServiceResult indicating success or failure
   */
  static async forwardLeave(
    leaveId: number,
    currentApproverId: number,
    comment?: string
  ): Promise<ServiceResult<any>> {
    try {
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

      // Get next approver to determine toRole
      const nextApprover = await this.getNextApprover(leave);

      if (!nextApprover) {
        return {
          success: false,
          error: {
            code: "no_next_approver",
            message: "Cannot forward: No next approver found in workflow"
          }
        }
      }

      return ApprovalService.forward(leaveId, currentApproverId, nextApprover.role as any, comment);
    } catch (error) {
      console.error("LeaveService.forwardLeave error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred while forwarding leave"
        }
      }
    }
  }

  /**
   * Return a leave request to the requester for modification.
   * 
   * @param leaveId - ID of the leave request
   * @param approverId - ID of the user returning the request
   * @param reason - Reason for returning
   * @returns ServiceResult indicating success or failure
   */
  static async returnLeave(
    leaveId: number,
    approverId: number,
    reason: string
  ): Promise<ServiceResult<any>> {
    return ApprovalService.returnForModification(leaveId, approverId, reason);
  }

  /**
   * Cancel a leave request.
   * 
   * Can only be performed by the requester. Updates status to CANCELLED.
   * 
   * @param leaveId - ID of the leave request
   * @param userId - ID of the user cancelling the request
   * @param reason - Optional reason for cancellation
   * @returns ServiceResult indicating success or failure
   */
  static async cancelLeave(
    leaveId: number,
    userId: number,
    reason?: string
  ): Promise<ServiceResult<any>> {
    try {
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

      // Check if user owns this leave
      if (leave.requesterId !== userId) {
        return {
          success: false,
          error: {
            code: "unauthorized",
            message: "You can only cancel your own leave requests",
          },
        };
      }

      await LeaveRepository.updateStatus(leaveId, "CANCELLED");

      await this.logAction(
        `user_${userId}`,
        "LEAVE_CANCELLED",
        { leaveId, reason }
      );

      // Send cancellation notification to approvers
      await NotificationService.notifyLeaveCancelled(leaveId);

      // Remove from Calendar
      const { CalendarService } = await import("@/lib/integrations/calendar/calendar-service");
      await CalendarService.deleteLeaveEvent(leaveId, userId);

      return {
        success: true,
        data: { cancelled: true },
      };
    } catch (error) {
      console.error("LeaveService.cancelLeave error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred while cancelling leave",
        },
      };
    }
  }

  // ===== Private Helper Methods =====

  private static async uploadCertificate(
    file: File
  ): Promise<ServiceResult<string>> {
    try {
      const validation = LeaveValidator.validateFileUpload(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const finalName = `${randomUUID()}-${safeName}`;
      const uploadDir = path.join(process.cwd(), "private", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, finalName), buffer);
      const signedUrl = generateSignedUrl(finalName);

      return {
        success: true,
        data: signedUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "file_upload_failed",
          message: "Failed to upload certificate",
        },
      };
    }
  }


  private static async findApprover(
    userId: number,
    role: string
  ): Promise<{ id: number } | null> {
    // Special case: For DEPT_HEAD role, use the employee's assigned department head
    if (role === "DEPT_HEAD") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { deptHeadId: true },
      });

      if (user?.deptHeadId) {
        return { id: user.deptHeadId };
      }
    }

    // For all other roles (HR_ADMIN, HR_HEAD, CEO), find by role
    const approver = await prisma.user.findFirst({
      where: { role: role as any },
      select: { id: true },
    });

    return approver;
  }

  private static async isFinalApproval(leaveId: number): Promise<boolean> {
    // Get the leave request with all approvals
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        approvals: {
          orderBy: { step: 'desc' }, // Highest step first
        },
      },
    });

    if (!leave || leave.approvals.length === 0) {
      // If no approvals defined, treating as not final (or handle as auto-approve elsewhere) 
      return false;
    }

    // The last step in the chain is the one with the highest step number (index 0 due to desc sort)
    const lastApproval = leave.approvals[0];

    return lastApproval.decision === ApprovalDecision.APPROVED;
  }

  private static async getCurrentStep(leaveId: number): Promise<number> {
    const maxStep = await prisma.approval.findFirst({
      where: { leaveId: leaveId },
      orderBy: { step: "desc" },
      select: { step: true },
    });

    return maxStep?.step || 0;
  }

  private static async getNextApprover(
    leave: any
  ): Promise<{ id: number; role: Role } | null> {
    // Logic: The "next" approver is the one responsible for the FIRST pending step.

    const approvals = await prisma.approval.findMany({
      where: { leaveId: leave.id },
      orderBy: { step: 'asc' }, // Order 1, 2, 3...
      include: {
        approver: { select: { role: true } },
      },
    });

    if (approvals.length === 0) return null;

    // Find the first approval that is still PENDING
    const nextPending = approvals.find(a => a.decision === ApprovalDecision.PENDING);

    if (!nextPending) {
      return null;
    }

    return {
      id: nextPending.approverId,
      role: nextPending.approver.role
    };
  }

  private static async deductFromBalance(
    userId: number,
    leaveType: LeaveType,
    days: number
  ): Promise<void> {
    const year = new Date().getFullYear();

    // Check if balance record exists first
    const balance = await prisma.balance.findFirst({
      where: {
        userId,
        type: leaveType,
        year,
      },
    });

    if (!balance) {
      console.error(`Balance record not found for user ${userId}, type ${leaveType}, year ${year}`);
      throw new Error(`Balance record not found for leave type ${leaveType}`);
    }

    // Update the balance
    const result = await prisma.balance.updateMany({
      where: {
        userId,
        type: leaveType,
        year,
      },
      data: {
        used: {
          increment: days,
        },
        closing: {
          decrement: days,
        },
      },
    });

    if (result.count === 0) {
      throw new Error(`Failed to deduct balance for user ${userId}`);
    }
  }

  /**
   * Get team leave requests for department head with filters and pagination
   */
  /**
   * Get team leave requests for department head with filters and pagination
   */
  static async getTeamLeaveRequests(
    deptHeadId: number,
    filters: {
      search?: string;
      status?: string;
      type?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<
    ServiceResult<{
      rows: any[];
      total: number;
      counts: {
        pending: number;
        forwarded: number;
        returned: number;
        cancelled: number;
      };
    }>
  > {
    return LeaveQueryService.getTeamLeaveRequests(deptHeadId, filters);
  }

  private static async logAction(
    actor: string,
    action: string,
    details?: any
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorEmail: actor,
        action,
        details: details || undefined,
      },
    });
  }
}
