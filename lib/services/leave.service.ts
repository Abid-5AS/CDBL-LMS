/**
 * Leave Service
 * Orchestrates business logic for leave management
 */

import { LeaveType, LeaveStatus } from "@prisma/client";
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
        incidentDate: dto.incidentDate,
      });

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // 5. Extract pay calculation for Special Disability Leave
      let payCalculation: any = undefined;
      if (dto.type === "SPECIAL_DISABILITY" && validation.warning?.details?.payCalculation) {
        payCalculation = validation.warning.details.payCalculation;
      }

      // 6. Create leave request
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

      // 8. Send notifications to approvers and requester
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

      // Send rejection notification
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

      // Send forward notification
      if (nextApprover) {
        const forwarder = await prisma.user.findUnique({
          where: { id: currentApproverId },
          select: { name: true },
        });
        if (forwarder) {
          await NotificationService.notifyLeaveForwarded(leaveId, nextApprover.id, forwarder.name);
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

      // Send return notification
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
  ): Promise<ServiceResult<{
    rows: any[];
    total: number;
    counts: {
      pending: number;
      forwarded: number;
      returned: number;
      cancelled: number;
    };
  }>> {
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
        `${r.requesterId}-${r.startDate.toISOString()}-${r.endDate.toISOString()}`;
      const seen = new Set<string>();
      const uniqueRows = rowsRaw.filter((r) =>
        seen.has(key(r)) ? false : seen.add(key(r))
      );

      // Calculate total after deduplication
      const total = uniqueRows.length;

      // Apply pagination AFTER deduplication
      const rows = uniqueRows.slice(
        (page - 1) * pageSize,
        page * pageSize
      );

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
