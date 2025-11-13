/**
 * Leave Service
 * Orchestrates business logic for leave management
 */

import { LeaveType, LeaveStatus } from "@prisma/client";
import { LeaveRepository } from "@/lib/repositories/leave.repository";
import { LeaveValidator } from "./leave-validator";
import { prisma } from "@/lib/prisma";
import { daysInclusive } from "@/lib/policy";
import { getStepForRole } from "@/lib/workflow";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { generateSignedUrl } from "@/lib/storage";

export type CreateLeaveRequestDTO = {
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  workingDays?: number;
  needsCertificate?: boolean;
  certificateFile?: File;
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
   * Create a new leave request
   */
  static async createLeaveRequest(
    userId: number,
    dto: CreateLeaveRequestDTO
  ): Promise<ServiceResult<any>> {
    try {
      // 1. Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          joinDate: true,
          retirementDate: true,
          departmentHeadId: true,
        },
      });

      if (!user || !user.joinDate) {
        return {
          success: false,
          error: {
            code: "user_not_found",
            message: "Employee record not found or incomplete",
          },
        };
      }

      // 2. Calculate working days if not provided
      const workingDays =
        dto.workingDays || daysInclusive(dto.startDate, dto.endDate);

      // 3. Handle certificate file upload
      let certificateUrl: string | undefined;
      if (dto.certificateFile) {
        const fileResult = await this.uploadCertificate(dto.certificateFile);
        if (!fileResult.success) {
          return fileResult;
        }
        certificateUrl = fileResult.data;
      }

      // 4. Validate leave request
      const validation = await LeaveValidator.validateLeaveRequest({
        userId,
        type: dto.type,
        startDate: dto.startDate,
        endDate: dto.endDate,
        workingDays,
        joinDate: user.joinDate,
        retirementDate: user.retirementDate,
        certificateFile: dto.certificateFile,
      });

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // 5. Create leave request
      const leaveRequest = await LeaveRepository.create({
        requesterId: userId,
        type: dto.type,
        startDate: dto.startDate,
        endDate: dto.endDate,
        workingDays,
        reason: dto.reason,
        certificateUrl,
        needsCertificate: dto.needsCertificate,
      });

      // 6. Create initial approval record
      const approverRole = this.getInitialApproverRole(dto.type, user.role);
      if (approverRole) {
        const approver = await this.findApprover(userId, approverRole);
        if (approver) {
          await prisma.approval.create({
            data: {
              leaveRequestId: leaveRequest.id,
              approverId: approver.id,
              step: 1,
              decision: "PENDING",
            },
          });
        }
      }

      // 7. Log the creation
      await this.logAction(
        user.email,
        "LEAVE_REQUEST_CREATED",
        `Created ${dto.type} leave request`,
        { leaveRequestId: leaveRequest.id }
      );

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
   * Approve a leave request
   */
  static async approveLeave(
    leaveId: number,
    approverId: number,
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

      // Update approval record
      await prisma.approval.updateMany({
        where: {
          leaveRequestId: leaveId,
          approverId,
          decision: "PENDING",
        },
        data: {
          decision: "APPROVED",
          comment,
          decidedAt: new Date(),
        },
      });

      // Check if this is final approval
      const isFinalApproval = await this.isFinalApproval(leaveId);

      if (isFinalApproval) {
        await LeaveRepository.updateStatus(leaveId, "APPROVED");

        // Deduct from balance
        await this.deductFromBalance(
          leave.requesterId,
          leave.type,
          leave.workingDays
        );
      }

      // Log action
      await this.logAction(
        `approver_${approverId}`,
        "LEAVE_APPROVED",
        `Approved leave request ${leaveId}`,
        { leaveId, comment }
      );

      return {
        success: true,
        data: { approved: true, final: isFinalApproval },
      };
    } catch (error) {
      console.error("LeaveService.approveLeave error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred while approving leave",
        },
      };
    }
  }

  /**
   * Reject a leave request
   */
  static async rejectLeave(
    leaveId: number,
    approverId: number,
    reason: string
  ): Promise<ServiceResult<any>> {
    try {
      // Update approval record
      await prisma.approval.updateMany({
        where: {
          leaveRequestId: leaveId,
          approverId,
          decision: "PENDING",
        },
        data: {
          decision: "REJECTED",
          comment: reason,
          decidedAt: new Date(),
        },
      });

      // Update leave status
      await LeaveRepository.updateStatus(leaveId, "REJECTED");

      // Log action
      await this.logAction(
        `approver_${approverId}`,
        "LEAVE_REJECTED",
        `Rejected leave request ${leaveId}`,
        { leaveId, reason }
      );

      return {
        success: true,
        data: { rejected: true },
      };
    } catch (error) {
      console.error("LeaveService.rejectLeave error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred while rejecting leave",
        },
      };
    }
  }

  /**
   * Forward leave to next approver
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

      // Update current approval
      await prisma.approval.updateMany({
        where: {
          leaveRequestId: leaveId,
          approverId: currentApproverId,
          decision: "PENDING",
        },
        data: {
          decision: "FORWARDED",
          comment,
          decidedAt: new Date(),
        },
      });

      // Create next approval
      const nextApprover = await this.getNextApprover(leave);
      if (nextApprover) {
        const currentStep = await this.getCurrentStep(leaveId);
        await prisma.approval.create({
          data: {
            leaveRequestId: leaveId,
            approverId: nextApprover.id,
            step: currentStep + 1,
            decision: "PENDING",
          },
        });
      }

      // Update status
      await LeaveRepository.updateStatus(leaveId, "FORWARDED");

      // Log action
      await this.logAction(
        `approver_${currentApproverId}`,
        "LEAVE_FORWARDED",
        `Forwarded leave request ${leaveId}`,
        { leaveId, comment }
      );

      return {
        success: true,
        data: { forwarded: true },
      };
    } catch (error) {
      console.error("LeaveService.forwardLeave error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred while forwarding leave",
        },
      };
    }
  }

  /**
   * Return leave for modification
   */
  static async returnLeave(
    leaveId: number,
    approverId: number,
    reason: string
  ): Promise<ServiceResult<any>> {
    try {
      await prisma.approval.updateMany({
        where: {
          leaveRequestId: leaveId,
          approverId,
          decision: "PENDING",
        },
        data: {
          decision: "RETURNED",
          comment: reason,
          decidedAt: new Date(),
        },
      });

      await LeaveRepository.updateStatus(leaveId, "RETURNED");

      await this.logAction(
        `approver_${approverId}`,
        "LEAVE_RETURNED",
        `Returned leave request ${leaveId} for modification`,
        { leaveId, reason }
      );

      return {
        success: true,
        data: { returned: true },
      };
    } catch (error) {
      console.error("LeaveService.returnLeave error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred while returning leave",
        },
      };
    }
  }

  /**
   * Cancel a leave request
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
        `Cancelled leave request ${leaveId}`,
        { leaveId, reason }
      );

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

  private static async uploadCertificate(file: File): Promise<ServiceResult<string>> {
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

  private static getInitialApproverRole(
    leaveType: LeaveType,
    userRole: string
  ): string | null {
    // For most users, first approver is department head
    if (userRole === "EMPLOYEE") {
      return "DEPT_HEAD";
    }
    return null;
  }

  private static async findApprover(
    userId: number,
    role: string
  ): Promise<{ id: number } | null> {
    // Find user's department head or role-based approver
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentHeadId: true },
    });

    if (user?.departmentHeadId) {
      return { id: user.departmentHeadId };
    }

    // Fallback: find first user with the role
    const approver = await prisma.user.findFirst({
      where: { role },
      select: { id: true },
    });

    return approver;
  }

  private static async isFinalApproval(leaveId: number): Promise<boolean> {
    const pendingApprovals = await prisma.approval.count({
      where: {
        leaveRequestId: leaveId,
        decision: "PENDING",
      },
    });

    return pendingApprovals === 0;
  }

  private static async getCurrentStep(leaveId: number): Promise<number> {
    const maxStep = await prisma.approval.findFirst({
      where: { leaveRequestId: leaveId },
      orderBy: { step: "desc" },
      select: { step: true },
    });

    return maxStep?.step || 0;
  }

  private static async getNextApprover(leave: any): Promise<{ id: number } | null> {
    // Simplified - would use workflow strategies in production
    const nextRole = "HR_HEAD"; // This should come from workflow strategy
    return this.findApprover(leave.requesterId, nextRole);
  }

  private static async deductFromBalance(
    userId: number,
    leaveType: LeaveType,
    days: number
  ): Promise<void> {
    const year = new Date().getFullYear();
    await prisma.balance.updateMany({
      where: {
        userId,
        type: leaveType,
        year,
      },
      data: {
        used: {
          increment: days,
        },
      },
    });
  }

  private static async logAction(
    actor: string,
    action: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorEmail: actor,
        action,
        description,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  }
}
