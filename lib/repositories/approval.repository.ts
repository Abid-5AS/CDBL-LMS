import { prisma } from "@/lib/prisma";
import { Prisma, ApprovalDecision } from "@prisma/client";

// Type for approval with all relations
export type ApprovalWithRelations = Prisma.ApprovalGetPayload<{
  include: {
    leave: {
      include: {
        requester: {
          select: {
            id: true;
            name: true;
            email: true;
            role: true;
          };
        };
      };
    };
    approver: {
      select: {
        id: true;
        name: true;
        email: true;
        role: true;
      };
    };
  };
}>;

/**
 * ApprovalRepository
 *
 * Handles all database operations for approvals.
 * Provides clean data access layer for the approval workflow.
 */
export class ApprovalRepository {
  /**
   * Default includes for approval queries
   */
  private static readonly DEFAULT_INCLUDES = {
    leave: {
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    },
    approver: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
  } satisfies Prisma.ApprovalInclude;

  /**
   * Find approval by ID
   */
  static async findById(id: number): Promise<ApprovalWithRelations | null> {
    return prisma.approval.findUnique({
      where: { id },
      include: this.DEFAULT_INCLUDES,
    });
  }

  /**
   * Find all approvals for a specific leave request
   */
  static async findByLeaveId(leaveId: number): Promise<ApprovalWithRelations[]> {
    return prisma.approval.findMany({
      where: { leaveId },
      include: this.DEFAULT_INCLUDES,
      orderBy: { step: "asc" },
    });
  }

  /**
   * Find pending approvals for a specific approver
   */
  static async findPendingForApprover(approverId: number): Promise<ApprovalWithRelations[]> {
    return prisma.approval.findMany({
      where: {
        approverId,
        decision: "PENDING",
      },
      include: this.DEFAULT_INCLUDES,
      orderBy: [
        { leave: { createdAt: "asc" } },
        { step: "asc" },
      ],
    });
  }

  /**
   * Find all approvals for a specific approver (including completed)
   */
  static async findByApproverId(
    approverId: number,
    options?: {
      decision?: ApprovalDecision;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApprovalWithRelations[]> {
    return prisma.approval.findMany({
      where: {
        approverId,
        ...(options?.decision ? { decision: options.decision } : {}),
      },
      include: this.DEFAULT_INCLUDES,
      orderBy: [
        { decidedAt: "desc" },
        { leave: { createdAt: "desc" } },
      ],
      take: options?.limit,
      skip: options?.offset,
    });
  }

  /**
   * Find current pending approval for a leave request
   */
  static async findCurrentPendingApproval(leaveId: number): Promise<ApprovalWithRelations | null> {
    return prisma.approval.findFirst({
      where: {
        leaveId,
        decision: "PENDING",
      },
      include: this.DEFAULT_INCLUDES,
      orderBy: { step: "asc" },
    });
  }

  /**
   * Create a new approval record
   */
  static async create(data: {
    leaveId: number;
    approverId: number;
    step: number;
    decision?: ApprovalDecision;
    comment?: string;
    toRole?: string;
  }): Promise<ApprovalWithRelations> {
    return prisma.approval.create({
      data: {
        leaveId: data.leaveId,
        approverId: data.approverId,
        step: data.step,
        decision: data.decision || "PENDING",
        comment: data.comment,
        toRole: data.toRole,
      },
      include: this.DEFAULT_INCLUDES,
    });
  }

  /**
   * Update approval decision
   */
  static async updateDecision(
    id: number,
    decision: ApprovalDecision,
    comment?: string,
    toRole?: string
  ): Promise<ApprovalWithRelations> {
    return prisma.approval.update({
      where: { id },
      data: {
        decision,
        comment,
        toRole,
        decidedAt: new Date(),
      },
      include: this.DEFAULT_INCLUDES,
    });
  }

  /**
   * Update approval by leave ID and approver ID
   */
  static async updateByLeaveAndApprover(
    leaveId: number,
    approverId: number,
    decision: ApprovalDecision,
    comment?: string
  ): Promise<number> {
    const result = await prisma.approval.updateMany({
      where: {
        leaveId,
        approverId,
        decision: "PENDING",
      },
      data: {
        decision,
        comment,
        decidedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Check if all approvals for a leave are completed
   */
  static async areAllApprovalsCompleted(leaveId: number): Promise<boolean> {
    const pendingCount = await prisma.approval.count({
      where: {
        leaveId,
        decision: "PENDING",
      },
    });

    return pendingCount === 0;
  }

  /**
   * Check if all approvals for a leave are approved
   */
  static async areAllApprovalsApproved(leaveId: number): Promise<boolean> {
    const approvals = await prisma.approval.findMany({
      where: { leaveId },
      select: { decision: true },
    });

    if (approvals.length === 0) return false;

    return approvals.every(
      (approval) => approval.decision === "APPROVED" || approval.decision === "FORWARDED"
    );
  }

  /**
   * Get approval statistics for an approver
   */
  static async getApproverStats(approverId: number): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    forwarded: number;
    total: number;
  }> {
    const [pending, approved, rejected, forwarded, total] = await Promise.all([
      prisma.approval.count({ where: { approverId, decision: "PENDING" } }),
      prisma.approval.count({ where: { approverId, decision: "APPROVED" } }),
      prisma.approval.count({ where: { approverId, decision: "REJECTED" } }),
      prisma.approval.count({ where: { approverId, decision: "FORWARDED" } }),
      prisma.approval.count({ where: { approverId } }),
    ]);

    return { pending, approved, rejected, forwarded, total };
  }

  /**
   * Get the next step number for a leave request
   */
  static async getNextStep(leaveId: number): Promise<number> {
    const maxStep = await prisma.approval.findFirst({
      where: { leaveId },
      select: { step: true },
      orderBy: { step: "desc" },
    });

    return (maxStep?.step || 0) + 1;
  }

  /**
   * Delete all approvals for a leave request
   */
  static async deleteByLeaveId(leaveId: number): Promise<number> {
    const result = await prisma.approval.deleteMany({
      where: { leaveId },
    });

    return result.count;
  }

  /**
   * Find approvals by date range
   */
  static async findByDateRange(
    approverId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ApprovalWithRelations[]> {
    return prisma.approval.findMany({
      where: {
        approverId,
        decidedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: this.DEFAULT_INCLUDES,
      orderBy: { decidedAt: "desc" },
    });
  }

  /**
   * Count pending approvals by approver
   */
  static async countPendingByApprover(approverId: number): Promise<number> {
    return prisma.approval.count({
      where: {
        approverId,
        decision: "PENDING",
      },
    });
  }
}
