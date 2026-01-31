import { prisma } from "@/lib/prisma";
import { LeaveType } from "@/src/generated/prisma/client";

export class DelegationService {
  /**
   * Create a new delegation
   */
  static async createDelegation(
    delegatorId: number,
    delegateId: number,
    data: {
      startDate: Date;
      endDate: Date;
      reason?: string;
      leaveTypes?: LeaveType[];
      isPermanent?: boolean;
    }
  ) {
    // Check for existing active delegation in this period
    const existing = await prisma.approvalDelegation.findFirst({
      where: {
        delegatorId,
        isActive: true,
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          },
          { isPermanent: true },
        ],
      },
    });

    if (existing) {
      throw new Error("An active delegation already exists for this period.");
    }

    return prisma.approvalDelegation.create({
      data: {
        delegatorId,
        delegateId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        leaveTypes: data.leaveTypes ? JSON.stringify(data.leaveTypes) : null,
        isPermanent: data.isPermanent || false,
      },
    });
  }

  /**
   * Get active delegation for a user at a specific date
   */
  static async getActiveDelegation(delegatorId: number, date: Date = new Date()) {
    const delegation = await prisma.approvalDelegation.findFirst({
      where: {
        delegatorId,
        isActive: true,
        OR: [
          {
            startDate: { lte: date },
            endDate: { gte: date },
          },
          { isPermanent: true },
        ],
      },
      include: {
        delegate: true,
      },
    });

    return delegation;
  }

  /**
   * Check if a user is currently a delegate for another user
   */
  static async isActingDelegate(delegateId: number, delegatorId: number) {
    const delegation = await this.getActiveDelegation(delegatorId);
    return delegation?.delegateId === delegateId;
  }

  /**
   * Revoke a delegation
   */
  static async revokeDelegation(delegationId: number, userId: number) {
    const delegation = await prisma.approvalDelegation.findUnique({
      where: { id: delegationId },
    });

    if (!delegation) {
      throw new Error("Delegation not found");
    }

    if (delegation.delegatorId !== userId) {
      throw new Error("Unauthorized to revoke this delegation");
    }

    return prisma.approvalDelegation.update({
      where: { id: delegationId },
      data: { isActive: false },
    });
  }

  /**
   * Get all delegations made by a user
   */
  static async getMyDelegations(userId: number) {
    return prisma.approvalDelegation.findMany({
      where: { delegatorId: userId },
      include: { delegate: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get all delegations where user is the delegate
   */
  static async getDelegatedToMe(userId: number) {
    return prisma.approvalDelegation.findMany({
      where: { delegateId: userId, isActive: true },
      include: { delegator: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Resolve the actual approver for a leave request
   * If the original approver has delegated, return the delegate
   */
  static async resolveApprover(originalApproverId: number, leaveType: LeaveType) {
    const delegation = await this.getActiveDelegation(originalApproverId);

    if (!delegation) {
      return originalApproverId;
    }

    // Check if delegation is restricted to specific leave types
    if (delegation.leaveTypes) {
      const allowedTypes = JSON.parse(delegation.leaveTypes as string) as LeaveType[];
      if (!allowedTypes.includes(leaveType)) {
        return originalApproverId;
      }
    }

    return delegation.delegateId;
  }
}
