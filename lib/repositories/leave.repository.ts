/**
 * Leave Repository
 * Handles all database operations for leave requests
 */

import { prisma } from "@/lib/prisma";
import { LeaveType, LeaveStatus, LeaveRequest, Prisma, ApprovalDecision } from "@prisma/client";

/**
 * Standard includes for leave requests
 */
const DEFAULT_INCLUDES = {
  requester: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      joinDate: true,
      retirementDate: true,
    },
  },
  approvals: {
    include: {
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      step: "asc" as const,
    },
  },
  comments: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
} satisfies Prisma.LeaveRequestInclude;

export type LeaveRequestWithRelations = Prisma.LeaveRequestGetPayload<{
  include: typeof DEFAULT_INCLUDES;
}>;

export class LeaveRepository {
  /**
   * Find leave request by ID
   */
  static async findById(id: number): Promise<LeaveRequestWithRelations | null> {
    return prisma.leaveRequest.findUnique({
      where: { id },
      include: DEFAULT_INCLUDES,
    });
  }

  /**
   * Find all leaves for a user
   */
  static async findByUserId(userId: number, status?: LeaveStatus, options?: { limit?: number }): Promise<LeaveRequestWithRelations[]> {
    return prisma.leaveRequest.findMany({
      where: {
        requesterId: userId,
        ...(status && { status }),
      },
      include: DEFAULT_INCLUDES,
      orderBy: { createdAt: "desc" },
      ...(options?.limit && { take: options.limit }),
    });
  }

  /**
   * Find pending leaves for a user
   */
  static async findPendingForUser(userId: number): Promise<LeaveRequestWithRelations[]> {
    return prisma.leaveRequest.findMany({
      where: {
        requesterId: userId,
        status: {
          in: ["PENDING", "SUBMITTED"],
        },
      },
      include: DEFAULT_INCLUDES,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find leaves requiring approval by user
   */
  static async findPendingForApprover(
    approverId: number
  ): Promise<LeaveRequestWithRelations[]> {
    return prisma.leaveRequest.findMany({
      where: {
        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.SUBMITTED],
        },
        approvals: {
          some: {
            approverId,
            decision: ApprovalDecision.PENDING,
          },
        },
      },
      include: DEFAULT_INCLUDES,
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Find all leaves with optional filters
   */
  static async findAll(filters?: {
    status?: LeaveStatus;
    type?: LeaveType;
    requesterId?: number;
    limit?: number;
  }): Promise<LeaveRequestWithRelations[]> {
    const { limit, ...whereFilters } = filters || {};
    return prisma.leaveRequest.findMany({
      where: whereFilters,
      include: DEFAULT_INCLUDES,
      orderBy: { createdAt: "desc" },
      ...(limit && { take: limit }),
    });
  }

  /**
   * Create a new leave request
   */
  static async create(data: {
    requesterId: number;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    reason: string;
    certificateUrl?: string;
    needsCertificate?: boolean;
    incidentDate?: Date; // For Special Disability Leave
    payCalculation?: any; // For Special Disability Leave: { fullPayDays, halfPayDays, unPaidDays }
  }): Promise<LeaveRequestWithRelations> {
    return prisma.leaveRequest.create({
      data: {
        ...data,
        status: "PENDING",
        policyVersion: "v2.0", // Default policy version
      },
      include: DEFAULT_INCLUDES,
    });
  }

  /**
   * Update leave request
   */
  static async update(
    id: number,
    data: Partial<{
      type: LeaveType;
      startDate: Date;
      endDate: Date;
      workingDays: number;
      reason: string;
      status: LeaveStatus;
      certificateUrl: string;
      needsCertificate: boolean;
    }>
  ): Promise<LeaveRequestWithRelations> {
    return prisma.leaveRequest.update({
      where: { id },
      data,
      include: DEFAULT_INCLUDES,
    });
  }

  /**
   * Update leave status
   */
  static async updateStatus(
    id: number,
    status: LeaveStatus
  ): Promise<LeaveRequestWithRelations> {
    return prisma.leaveRequest.update({
      where: { id },
      data: { status },
      include: DEFAULT_INCLUDES,
    });
  }

  /**
   * Delete leave request
   */
  static async delete(id: number): Promise<LeaveRequestWithRelations> {
    return prisma.leaveRequest.delete({
      where: { id },
      include: DEFAULT_INCLUDES,
    });
  }

  /**
   * Find overlapping leaves for a user
   */
  static async findOverlapping(
    userId: number,
    startDate: Date,
    endDate: Date,
    excludeId?: number
  ): Promise<LeaveRequestWithRelations[]> {
    return prisma.leaveRequest.findMany({
      where: {
        requesterId: userId,
        ...(excludeId && { id: { not: excludeId } }),
        status: {
          notIn: ["REJECTED", "CANCELLED"],
        },
        OR: [
          {
            // Overlaps start
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      include: DEFAULT_INCLUDES,
    });
  }

  /**
   * Count leaves by type for a user in a year
   */
  static async countByTypeAndYear(
    userId: number,
    type: LeaveType,
    year: number
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    return prisma.leaveRequest.count({
      where: {
        requesterId: userId,
        type,
        status: {
          in: ["APPROVED", "PENDING", "SUBMITTED"],
        },
        startDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });
  }

  /**
   * Get total days used by type for a user in a year
   */
  static async getTotalDaysUsed(
    userId: number,
    type: LeaveType,
    year: number
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: userId,
        type,
        status: "APPROVED",
        startDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        workingDays: true,
      },
    });

    return leaves.reduce((sum, leave) => sum + leave.workingDays, 0);
  }

  /**
   * Find recent leaves for a user (for combination checks)
   */
  static async findRecentLeaves(
    userId: number,
    sinceDate: Date,
    excludeTypes?: LeaveType[]
  ): Promise<LeaveRequestWithRelations[]> {
    return prisma.leaveRequest.findMany({
      where: {
        requesterId: userId,
        status: {
          notIn: ["REJECTED", "CANCELLED"],
        },
        endDate: {
          gte: sinceDate,
        },
        ...(excludeTypes && {
          type: { notIn: excludeTypes },
        }),
      },
      include: DEFAULT_INCLUDES,
      orderBy: { startDate: "desc" },
    });
  }

  /**
   * Check if user has pending leave requests
   */
  static async hasPendingRequests(userId: number): Promise<boolean> {
    const count = await prisma.leaveRequest.count({
      where: {
        requesterId: userId,
        status: {
          in: ["PENDING", "SUBMITTED"],
        },
      },
    });

    return count > 0;
  }

  /**
   * Get leave statistics for a user
   */
  static async getUserLeaveStats(userId: number, year: number) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: userId,
        startDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        type: true,
        status: true,
        workingDays: true,
      },
    });

    const stats = {
      total: leaves.length,
      approved: leaves.filter((l) => l.status === "APPROVED").length,
      pending: leaves.filter((l) =>
        ["PENDING", "SUBMITTED"].includes(l.status)
      ).length,
      rejected: leaves.filter((l) => l.status === "REJECTED").length,
      byType: {} as Record<string, { count: number; days: number }>,
    };

    leaves.forEach((leave) => {
      if (!stats.byType[leave.type]) {
        stats.byType[leave.type] = { count: 0, days: 0 };
      }
      stats.byType[leave.type].count++;
      if (leave.status === "APPROVED") {
        stats.byType[leave.type].days += leave.workingDays;
      }
    });

    return stats;
  }
}
