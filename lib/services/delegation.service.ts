import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { startOfDay, endOfDay, isWithinInterval, isBefore, isAfter } from "date-fns";

export interface DelegationResult {
  success: boolean;
  data?: {
    delegationId: number;
    delegatorName: string;
    delegateName: string;
    startDate: Date;
    endDate: Date;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ActiveDelegation {
  id: number;
  delegatorId: number;
  delegatorName: string;
  delegateId: number;
  delegateName: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  createdAt: Date;
}

/**
 * DelegationService
 *
 * Manages approval authority delegation for business continuity
 */
export class DelegationService {
  /**
   * Create a new delegation
   */
  static async createDelegation(
    delegatorId: number,
    delegateId: number,
    startDate: Date,
    endDate: Date,
    reason?: string
  ): Promise<DelegationResult> {
    try {
      // Validate delegator and delegate exist
      const [delegator, delegate] = await Promise.all([
        prisma.user.findUnique({
          where: { id: delegatorId },
          select: { id: true, name: true, role: true },
        }),
        prisma.user.findUnique({
          where: { id: delegateId },
          select: { id: true, name: true, role: true },
        }),
      ]);

      if (!delegator) {
        return {
          success: false,
          error: {
            code: "delegator_not_found",
            message: "Delegator not found",
          },
        };
      }

      if (!delegate) {
        return {
          success: false,
          error: {
            code: "delegate_not_found",
            message: "Delegate not found",
          },
        };
      }

      // Cannot delegate to self
      if (delegatorId === delegateId) {
        return {
          success: false,
          error: {
            code: "self_delegation",
            message: "Cannot delegate to yourself",
          },
        };
      }

      // Validate delegator has approval authority
      const canApprove = [
        Role.DEPT_HEAD,
        Role.HR_HEAD,
        Role.CEO,
        Role.SYSTEM_ADMIN,
      ].includes(delegator.role);

      if (!canApprove) {
        return {
          success: false,
          error: {
            code: "no_approval_authority",
            message: "Delegator does not have approval authority",
          },
        };
      }

      // Validate delegate has appropriate role (same or higher level)
      const roleHierarchy = {
        [Role.EMPLOYEE]: 0,
        [Role.DEPT_HEAD]: 1,
        [Role.HR_ADMIN]: 2,
        [Role.HR_HEAD]: 3,
        [Role.CEO]: 4,
        [Role.SYSTEM_ADMIN]: 5,
      };

      if (roleHierarchy[delegate.role] < roleHierarchy[delegator.role]) {
        return {
          success: false,
          error: {
            code: "insufficient_role",
            message: "Delegate must have same or higher role level",
          },
        };
      }

      // Validate dates
      const now = new Date();
      if (isBefore(endDate, startDate)) {
        return {
          success: false,
          error: {
            code: "invalid_dates",
            message: "End date must be after start date",
          },
        };
      }

      if (isBefore(endDate, now)) {
        return {
          success: false,
          error: {
            code: "past_end_date",
            message: "End date cannot be in the past",
          },
        };
      }

      // Check for overlapping delegations
      const overlapping = await prisma.approvalDelegation.findFirst({
        where: {
          delegatorId,
          isActive: true,
          OR: [
            {
              // New delegation starts during existing
              startDate: { lte: startDate },
              endDate: { gte: startDate },
            },
            {
              // New delegation ends during existing
              startDate: { lte: endDate },
              endDate: { gte: endDate },
            },
            {
              // New delegation spans existing
              startDate: { gte: startDate },
              endDate: { lte: endDate },
            },
          ],
        },
      });

      if (overlapping) {
        return {
          success: false,
          error: {
            code: "overlapping_delegation",
            message: "You already have an active delegation during this period",
          },
        };
      }

      // Create delegation
      const delegation = await prisma.approvalDelegation.create({
        data: {
          delegatorId,
          delegateId,
          startDate: startOfDay(startDate),
          endDate: endOfDay(endDate),
          reason,
        },
      });

      // Create notifications
      await Promise.all([
        // Notify delegate
        prisma.notification.create({
          data: {
            userId: delegateId,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "Approval Authority Delegated to You",
            message: `${delegator.name} has delegated their approval authority to you from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`,
            link: "/approvals/delegated",
          },
        }),
        // Notify delegator (confirmation)
        prisma.notification.create({
          data: {
            userId: delegatorId,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "Delegation Created",
            message: `You have delegated your approval authority to ${delegate.name} from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`,
            link: "/approvals/delegate",
          },
        }),
      ]);

      return {
        success: true,
        data: {
          delegationId: delegation.id,
          delegatorName: delegator.name,
          delegateName: delegate.name,
          startDate: delegation.startDate,
          endDate: delegation.endDate,
        },
      };
    } catch (error) {
      console.error("[DelegationService] Error creating delegation:", error);
      return {
        success: false,
        error: {
          code: "creation_error",
          message: "Failed to create delegation",
        },
      };
    }
  }

  /**
   * Get active delegation for a delegator (if exists for current date)
   */
  static async getActiveDelegation(
    delegatorId: number,
    date: Date = new Date()
  ): Promise<ActiveDelegation | null> {
    try {
      const delegation = await prisma.approvalDelegation.findFirst({
        where: {
          delegatorId,
          isActive: true,
          startDate: { lte: date },
          endDate: { gte: date },
        },
        include: {
          delegator: { select: { name: true } },
          delegate: { select: { name: true } },
        },
      });

      if (!delegation) return null;

      return {
        id: delegation.id,
        delegatorId: delegation.delegatorId,
        delegatorName: delegation.delegator.name,
        delegateId: delegation.delegateId,
        delegateName: delegation.delegate.name,
        startDate: delegation.startDate,
        endDate: delegation.endDate,
        reason: delegation.reason,
        createdAt: delegation.createdAt,
      };
    } catch (error) {
      console.error(
        "[DelegationService] Error getting active delegation:",
        error
      );
      return null;
    }
  }

  /**
   * Get all delegations received by a delegate
   */
  static async getDelegatedApprovals(
    delegateId: number
  ): Promise<ActiveDelegation[]> {
    try {
      const now = new Date();
      const delegations = await prisma.approvalDelegation.findMany({
        where: {
          delegateId,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: {
          delegator: { select: { name: true } },
          delegate: { select: { name: true } },
        },
        orderBy: {
          startDate: "asc",
        },
      });

      return delegations.map((d) => ({
        id: d.id,
        delegatorId: d.delegatorId,
        delegatorName: d.delegator.name,
        delegateId: d.delegateId,
        delegateName: d.delegate.name,
        startDate: d.startDate,
        endDate: d.endDate,
        reason: d.reason,
        createdAt: d.createdAt,
      }));
    } catch (error) {
      console.error(
        "[DelegationService] Error getting delegated approvals:",
        error
      );
      return [];
    }
  }

  /**
   * Get all delegations created by a delegator
   */
  static async getMyDelegations(
    delegatorId: number,
    includeInactive: boolean = false
  ): Promise<ActiveDelegation[]> {
    try {
      const delegations = await prisma.approvalDelegation.findMany({
        where: {
          delegatorId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          delegator: { select: { name: true } },
          delegate: { select: { name: true } },
        },
        orderBy: {
          startDate: "desc",
        },
      });

      return delegations.map((d) => ({
        id: d.id,
        delegatorId: d.delegatorId,
        delegatorName: d.delegator.name,
        delegateId: d.delegateId,
        delegateName: d.delegate.name,
        startDate: d.startDate,
        endDate: d.endDate,
        reason: d.reason,
        createdAt: d.createdAt,
      }));
    } catch (error) {
      console.error(
        "[DelegationService] Error getting my delegations:",
        error
      );
      return [];
    }
  }

  /**
   * Revoke a delegation
   */
  static async revokeDelegation(
    delegationId: number,
    delegatorId: number
  ): Promise<DelegationResult> {
    try {
      // Verify delegation belongs to delegator
      const delegation = await prisma.approvalDelegation.findUnique({
        where: { id: delegationId },
        include: {
          delegator: { select: { name: true } },
          delegate: { select: { id: true, name: true } },
        },
      });

      if (!delegation) {
        return {
          success: false,
          error: {
            code: "not_found",
            message: "Delegation not found",
          },
        };
      }

      if (delegation.delegatorId !== delegatorId) {
        return {
          success: false,
          error: {
            code: "unauthorized",
            message: "You can only revoke your own delegations",
          },
        };
      }

      // Revoke delegation
      await prisma.approvalDelegation.update({
        where: { id: delegationId },
        data: { isActive: false },
      });

      // Notify delegate
      await prisma.notification.create({
        data: {
          userId: delegation.delegateId,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Delegation Revoked",
          message: `${delegation.delegator.name} has revoked the approval delegation that was assigned to you.`,
          link: "/approvals",
        },
      });

      return {
        success: true,
        data: {
          delegationId: delegation.id,
          delegatorName: delegation.delegator.name,
          delegateName: delegation.delegate.name,
          startDate: delegation.startDate,
          endDate: delegation.endDate,
        },
      };
    } catch (error) {
      console.error("[DelegationService] Error revoking delegation:", error);
      return {
        success: false,
        error: {
          code: "revoke_error",
          message: "Failed to revoke delegation",
        },
      };
    }
  }

  /**
   * Check if user can approve on behalf of another user (via delegation)
   */
  static async canApproveOnBehalfOf(
    potentialDelegateId: number,
    originalApproverId: number,
    date: Date = new Date()
  ): Promise<boolean> {
    try {
      const delegation = await this.getActiveDelegation(originalApproverId, date);
      return delegation?.delegateId === potentialDelegateId;
    } catch (error) {
      console.error(
        "[DelegationService] Error checking delegation authority:",
        error
      );
      return false;
    }
  }

  /**
   * Auto-deactivate expired delegations (maintenance task)
   */
  static async deactivateExpiredDelegations(): Promise<number> {
    try {
      const now = new Date();
      const result = await prisma.approvalDelegation.updateMany({
        where: {
          isActive: true,
          endDate: { lt: now },
        },
        data: {
          isActive: false,
        },
      });

      return result.count;
    } catch (error) {
      console.error(
        "[DelegationService] Error deactivating expired delegations:",
        error
      );
      return 0;
    }
  }
}
