/**
 * Leave Service
 * Orchestrates business logic for leave management
 */

import { LeaveType, LeaveStatus, ApprovalDecision } from "@prisma/client";
import { LeaveRepository } from "@/lib/repositories/leave.repository";
import { LeaveValidator } from "./leave-validator";
import { NotificationService } from "./notification.service";
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
  incidentDate?: Date; // For Special Disability Leave - when the disabling incident occurred
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
      // 1. Check for duplicate submissions (idempotency check)
      // Look for identical requests within the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existingRequest = await prisma.leaveRequest.findFirst({
        where: {
          requesterId: userId,
          type: dto.type,
          startDate: dto.startDate,
          endDate: dto.endDate,
          reason: dto.reason,
          createdAt: {
            gte: fiveMinutesAgo,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingRequest) {
        // Return the existing request to prevent duplicate
        return {
          success: true,
          data: existingRequest,
        };
      }

      // 2. Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          joinDate: true,
          retirementDate: true,
          deptHeadId: true,
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

      // 3. Calculate working days if not provided
      const workingDays =
        dto.workingDays || daysInclusive(dto.startDate, dto.endDate);

      // 4. Handle certificate file upload
      let certificateUrl: string | undefined;
      if (dto.certificateFile) {
        const fileResult = await this.uploadCertificate(dto.certificateFile);
        if (!fileResult.success) {
          return fileResult;
        }
        certificateUrl = fileResult.data;
      }

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

      // 7. Create leave request
      const leaveRequest = await LeaveRepository.create({
        requesterId: userId,
        type: dto.type,
        startDate: dto.startDate,
        endDate: dto.endDate,
        workingDays,
        reason: dto.reason,
        certificateUrl,
        needsCertificate: dto.needsCertificate,
        incidentDate: dto.incidentDate,
        payCalculation: payCalculation,
      });

      // 8. Create initial approval record
      // First approver is always HR_ADMIN (step 1)
      const approverRole = "HR_ADMIN";
      const approver = await this.findApprover(userId, approverRole);
      if (approver) {
        await prisma.approval.create({
          data: {
            leaveId: leaveRequest.id,
            approverId: approver.id,
            step: 1,
            decision: ApprovalDecision.PENDING,
          },
        });
      }

      // 9. Log the creation
      await this.logAction(
        user.email,
        "LEAVE_REQUEST_CREATED",
        { leaveId: leaveRequest.id }
      );

      // 10. Send notifications to approvers and requester
      await NotificationService.notifyLeaveSubmitted(leaveRequest.id, userId);

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
          leaveId: leaveId,
          approverId,
          decision: ApprovalDecision.PENDING,
        },
        data: {
          decision: ApprovalDecision.APPROVED,
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
        { leaveId, comment }
      );

      // Send approval notification (only on final approval)
      if (isFinalApproval) {
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
          leaveId: leaveId,
          approverId,
          decision: ApprovalDecision.PENDING,
        },
        data: {
          decision: ApprovalDecision.REJECTED,
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
        { leaveId, reason }
      );

      // Send rejection notification
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
        select: { name: true },
      });
      if (approver) {
        await NotificationService.notifyLeaveRejected(
          leaveId,
          approver.name,
          reason
        );
      }

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

      // Get next approver first to determine toRole
      const nextApprover = await this.getNextApprover(leave);

      // Update current approval
      await prisma.approval.updateMany({
        where: {
          leaveId: leaveId,
          approverId: currentApproverId,
          decision: ApprovalDecision.PENDING,
        },
        data: {
          decision: ApprovalDecision.FORWARDED,
          toRole: nextApprover?.role || null,
          comment,
          decidedAt: new Date(),
        },
      });

      // Create next approval
      if (nextApprover) {
        const currentStep = await this.getCurrentStep(leaveId);
        await prisma.approval.create({
          data: {
            leaveId: leaveId,
            approverId: nextApprover.id,
            step: currentStep + 1,
            decision: ApprovalDecision.PENDING,
          },
        });
      }

      // Update status - keep as PENDING since it's still being processed
      await LeaveRepository.updateStatus(leaveId, "PENDING");

      // Log action
      await this.logAction(
        `approver_${currentApproverId}`,
        "LEAVE_FORWARDED",
        { leaveId, comment }
      );

      // Send forward notification
      if (nextApprover) {
        const forwarder = await prisma.user.findUnique({
          where: { id: currentApproverId },
          select: { name: true },
        });
        if (forwarder) {
          await NotificationService.notifyLeaveForwarded(
            leaveId,
            nextApprover.id,
            forwarder.name
          );
        }
      }

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
      // Update existing pending approval to FORWARDED with toRole: null
      // This indicates the leave is being sent back to employee for modification
      await prisma.approval.updateMany({
        where: {
          leaveId: leaveId,
          approverId,
          decision: ApprovalDecision.PENDING,
        },
        data: {
          decision: ApprovalDecision.FORWARDED,
          toRole: null, // Returning to employee (no next role)
          comment: reason,
          decidedAt: new Date(),
        },
      });

      await LeaveRepository.updateStatus(leaveId, "RETURNED");

      await this.logAction(
        `approver_${approverId}`,
        "LEAVE_RETURNED",
        { leaveId, reason }
      );

      // Send return notification
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
        select: { name: true },
      });
      if (approver) {
        await NotificationService.notifyLeaveReturned(
          leaveId,
          approver.name,
          reason
        );
      }

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
        { leaveId, reason }
      );

      // Send cancellation notification to approvers
      await NotificationService.notifyLeaveCancelled(leaveId);

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
      where: { role },
      select: { id: true },
    });

    return approver;
  }

  private static async isFinalApproval(leaveId: number): Promise<boolean> {
    // Get the leave request with requester info
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        requester: { select: { role: true } },
        approvals: {
          include: {
            approver: { select: { role: true } },
          },
          orderBy: { step: 'desc' },
        },
      },
    });

    if (!leave) {
      return false;
    }

    // Get the appropriate workflow chain based on requester role
    const { getChainFor } = await import('@/lib/workflow');
    const chain = getChainFor(leave.type, leave.requester.role as any);

    // Check if we have an approval from the final approver in the chain
    const finalRole = chain[chain.length - 1];

    // Find if there's an approved approval from the final approver
    const finalApproval = leave.approvals.find(
      (approval) =>
        approval.approver.role === finalRole &&
        approval.decision === 'APPROVED'
    );

    return !!finalApproval;
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
  ): Promise<{ id: number; role: string } | null> {
    // Get requester to determine the workflow chain
    const requester = await prisma.user.findUnique({
      where: { id: leave.requesterId },
      select: { role: true },
    });

    if (!requester) {
      return null;
    }

    // Get current approval step
    const currentApproval = await prisma.approval.findFirst({
      where: {
        leaveId: leave.id,
        decision: ApprovalDecision.PENDING,
      },
      orderBy: { step: 'desc' },
      include: {
        approver: { select: { role: true } },
      },
    });

    if (!currentApproval) {
      return null;
    }

    // Import workflow functions
    const { getNextRoleInChain } = await import('@/lib/workflow');

    // Get next role in chain based on current approver's role and requester's role
    const nextRole = getNextRoleInChain(
      currentApproval.approver.role as any,
      leave.type,
      requester.role as any
    );

    if (!nextRole) {
      return null;
    }

    const approver = await this.findApprover(leave.requesterId, nextRole);
    return approver ? { id: approver.id, role: nextRole } : null;
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
    try {
      const {
        search = "",
        status = "PENDING",
        type = "ALL",
        page = 1,
        pageSize = 10,
      } = filters;

      // Get team members
      const teamMembers = await prisma.user.findMany({
        where: { deptHeadId },
        select: { id: true },
      });
      const teamMemberIds = teamMembers.map((m) => m.id);

      // If no team members, return empty results
      if (teamMemberIds.length === 0) {
        return {
          success: true,
          data: {
            rows: [],
            total: 0,
            counts: {
              pending: 0,
              forwarded: 0,
              returned: 0,
              cancelled: 0,
            },
          },
        };
      }

      // Build where clause
      const where = this.buildTeamLeaveWhere(
        deptHeadId,
        search,
        status,
        type,
        teamMemberIds
      );

      // Fetch all rows matching the filter (for deduplication)
      const rowsRaw = await prisma.leaveRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              deptHeadId: true,
            },
          },
          approvals: {
            include: {
              approver: {
                select: { name: true, role: true },
              },
            },
            orderBy: { step: "asc" },
          },
        },
        orderBy: [{ startDate: "asc" }, { id: "asc" }],
      });

      // Deduplicate (same requester + dates)
      const key = (r: any) =>
        `${
          r.requesterId
        }-${r.startDate.toISOString()}-${r.endDate.toISOString()}`;
      const seen = new Set<string>();
      const uniqueRows = rowsRaw.filter((r) =>
        seen.has(key(r)) ? false : seen.add(key(r))
      );

      // Calculate total after deduplication
      const total = uniqueRows.length;

      // Apply pagination AFTER deduplication
      const rows = uniqueRows.slice((page - 1) * pageSize, page * pageSize);

      // Calculate status counts
      const counts = await this.getTeamLeaveCounts(deptHeadId, teamMemberIds);

      // Serialize rows
      const serializedRows = rows.map((r) => ({
        id: r.id,
        type: r.type,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        workingDays: r.workingDays,
        reason: r.reason,
        status: r.status,
        isModified: (r as any).isModified ?? false,
        requester: r.requester,
        approvals: r.approvals.map((a) => ({
          id: a.id,
          decision: a.decision,
          toRole: a.toRole,
          approverId: a.approverId,
          approver: a.approver,
          decidedAt: a.decidedAt?.toISOString() || null,
          comment: a.comment,
        })),
      }));

      return {
        success: true,
        data: {
          rows: serializedRows,
          total,
          counts,
        },
      };
    } catch (error) {
      console.error("LeaveService.getTeamLeaveRequests error:", error);
      return {
        success: false,
        error: {
          code: "fetch_error",
          message: "Failed to fetch team leave requests",
        },
      };
    }
  }

  /**
   * Build where clause for team leave requests
   */
  private static buildTeamLeaveWhere(
    deptHeadId: number,
    search: string,
    status: string,
    type: string,
    teamMemberIds: number[]
  ): any {
    const base: any = {
      requesterId: { in: teamMemberIds },
    };

    // Type filter
    if (type && type !== "ALL") {
      base.type = type as LeaveType;
    }

    // Search filter
    if (search) {
      base.OR = [
        { requester: { name: { contains: search, mode: "insensitive" } } },
        { requester: { email: { contains: search, mode: "insensitive" } } },
        { reason: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status scope for Dept Head
    if (status === "PENDING") {
      base.status = { in: [LeaveStatus.PENDING, LeaveStatus.SUBMITTED] };
      base.AND = [
        {
          approvals: {
            some: {
              decision: "FORWARDED",
              toRole: "DEPT_HEAD",
            },
          },
        },
        {
          approvals: {
            none: {
              approverId: deptHeadId,
              decision: {
                in: ["FORWARDED", "APPROVED", "REJECTED"],
              },
            },
          },
        },
      ];
    } else if (status === "FORWARDED") {
      base.status = LeaveStatus.PENDING;
      base.approvals = {
        some: {
          decision: "FORWARDED",
          approverId: deptHeadId,
          toRole: { not: null },
        },
      };
    } else if (status === "RETURNED") {
      base.status = LeaveStatus.RETURNED;
      base.approvals = {
        some: {
          approverId: deptHeadId,
          decision: "FORWARDED",
          toRole: null,
        },
      };
    } else if (status === "CANCELLED") {
      base.status = LeaveStatus.CANCELLED;
    } else if (status === "ALL") {
      base.status = {
        in: [
          LeaveStatus.PENDING,
          LeaveStatus.SUBMITTED,
          LeaveStatus.RETURNED,
          LeaveStatus.CANCELLED,
        ],
      };
    }

    return base;
  }

  /**
   * Get status counts for team leave requests
   */
  private static async getTeamLeaveCounts(
    deptHeadId: number,
    teamMemberIds: number[]
  ): Promise<{
    pending: number;
    forwarded: number;
    returned: number;
    cancelled: number;
  }> {
    const baseDept = { requesterId: { in: teamMemberIds } };

    const [pending, forwarded, returned, cancelled] = await Promise.all([
      prisma.leaveRequest.count({
        where: {
          ...baseDept,
          status: { in: [LeaveStatus.PENDING, LeaveStatus.SUBMITTED] },
          AND: [
            {
              approvals: {
                some: {
                  decision: "FORWARDED",
                  toRole: "DEPT_HEAD",
                },
              },
            },
            {
              approvals: {
                none: {
                  approverId: deptHeadId,
                  decision: {
                    in: ["FORWARDED", "APPROVED", "REJECTED"],
                  },
                },
              },
            },
          ],
        },
      }),
      prisma.leaveRequest.count({
        where: {
          ...baseDept,
          status: LeaveStatus.PENDING,
          approvals: {
            some: {
              decision: "FORWARDED",
              approverId: deptHeadId,
              toRole: { not: null },
            },
          },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          ...baseDept,
          status: LeaveStatus.RETURNED,
          approvals: {
            some: {
              approverId: deptHeadId,
              decision: "FORWARDED",
              toRole: null,
            },
          },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          ...baseDept,
          status: LeaveStatus.CANCELLED,
        },
      }),
    ]);

    return { pending, forwarded, returned, cancelled };
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
