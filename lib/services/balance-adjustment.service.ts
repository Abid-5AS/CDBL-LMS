import { prisma } from "@/lib/prisma";
import { LeaveType, Role } from "@/src/generated/prisma/client";

export interface BalanceAdjustmentResult {
  success: boolean;
  data?: {
    adjustmentId: number;
    previousBalance: number;
    newBalance: number;
    amount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface AdjustmentHistory {
  id: number;
  userId: number;
  userName: string;
  leaveType: LeaveType;
  year: number;
  amount: number;
  reason: string;
  previousBalance: number;
  newBalance: number;
  adjustedBy: number;
  adjustedByName: string;
  createdAt: Date;
}

/**
 * BalanceAdjustmentService
 *
 * Handles manual balance adjustments by SYSTEM_ADMIN
 * Provides audit trail and validation for all adjustments
 */
export class BalanceAdjustmentService {
  /**
   * Adjust employee leave balance
   * Only SYSTEM_ADMIN can perform this operation
   */
  static async adjustBalance(
    userId: number,
    leaveType: LeaveType,
    year: number,
    amount: number,
    reason: string,
    adjustedById: number
  ): Promise<BalanceAdjustmentResult> {
    try {
      // Validate adjustedBy is SYSTEM_ADMIN
      const admin = await prisma.user.findUnique({
        where: { id: adjustedById },
        select: { role: true },
      });

      if (!admin || admin.role !== Role.SYSTEM_ADMIN) {
        return {
          success: false,
          error: {
            code: "unauthorized",
            message: "Only SYSTEM_ADMIN can adjust balances",
          },
        };
      }

      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      });

      if (!user) {
        return {
          success: false,
          error: {
            code: "user_not_found",
            message: "Employee not found",
          },
        };
      }

      // Validate amount is not zero
      if (amount === 0) {
        return {
          success: false,
          error: {
            code: "invalid_amount",
            message: "Adjustment amount cannot be zero",
          },
        };
      }

      // Validate reason is provided
      if (!reason || reason.trim().length < 10) {
        return {
          success: false,
          error: {
            code: "invalid_reason",
            message: "Reason must be at least 10 characters",
          },
        };
      }

      // Get or create balance record
      let balance = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId,
            type: leaveType,
            year,
          },
        },
      });

      const previousBalance = balance?.closing || 0;

      if (!balance) {
        // Create new balance record
        balance = await prisma.balance.create({
          data: {
            userId,
            type: leaveType,
            year,
            opening: 0,
            accrued: 0,
            used: 0,
            closing: amount, // Start with adjustment amount
          },
        });
      } else {
        // Update existing balance
        balance = await prisma.balance.update({
          where: {
            userId_type_year: {
              userId,
              type: leaveType,
              year,
            },
          },
          data: {
            closing: previousBalance + amount,
          },
        });
      }

      const newBalance = balance.closing;

      // Create adjustment record for audit trail
      const adjustment = await prisma.balanceAdjustment.create({
        data: {
          userId,
          leaveType,
          year,
          amount,
          reason: reason.trim(),
          previousBalance,
          newBalance,
          adjustedBy: adjustedById,
        },
      });

      // Create notification for affected user
      await prisma.notification.create({
        data: {
          userId,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Balance Adjusted",
          message: `Your ${leaveType} balance for ${year} has been ${
            amount > 0 ? "increased" : "decreased"
          } by ${Math.abs(amount)} days. New balance: ${newBalance} days.`,
          link: `/balance`,
        },
      });

      return {
        success: true,
        data: {
          adjustmentId: adjustment.id,
          previousBalance,
          newBalance,
          amount,
        },
      };
    } catch (error) {
      console.error(
        "[BalanceAdjustmentService] Error adjusting balance:",
        error
      );
      return {
        success: false,
        error: {
          code: "adjustment_error",
          message: "Failed to adjust balance",
        },
      };
    }
  }

  /**
   * Get adjustment history for an employee
   */
  static async getAdjustmentHistory(
    userId: number,
    options?: {
      leaveType?: LeaveType;
      year?: number;
      limit?: number;
    }
  ): Promise<AdjustmentHistory[]> {
    try {
      const adjustments = await prisma.balanceAdjustment.findMany({
        where: {
          userId,
          ...(options?.leaveType && { leaveType: options.leaveType }),
          ...(options?.year && { year: options.year }),
        },
        include: {
          user: {
            select: { name: true },
          },
          adjustedByUser: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: options?.limit || 50,
      });

      return adjustments.map((adj) => ({
        id: adj.id,
        userId: adj.userId,
        userName: adj.user.name,
        leaveType: adj.leaveType,
        year: adj.year,
        amount: adj.amount,
        reason: adj.reason,
        previousBalance: adj.previousBalance,
        newBalance: adj.newBalance,
        adjustedBy: adj.adjustedBy,
        adjustedByName: adj.adjustedByUser.name,
        createdAt: adj.createdAt,
      }));
    } catch (error) {
      console.error(
        "[BalanceAdjustmentService] Error getting adjustment history:",
        error
      );
      return [];
    }
  }

  /**
   * Get all adjustments made by a specific admin
   */
  static async getAdjustmentsByAdmin(
    adminId: number,
    limit: number = 50
  ): Promise<AdjustmentHistory[]> {
    try {
      const adjustments = await prisma.balanceAdjustment.findMany({
        where: {
          adjustedBy: adminId,
        },
        include: {
          user: {
            select: { name: true },
          },
          adjustedByUser: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      return adjustments.map((adj) => ({
        id: adj.id,
        userId: adj.userId,
        userName: adj.user.name,
        leaveType: adj.leaveType,
        year: adj.year,
        amount: adj.amount,
        reason: adj.reason,
        previousBalance: adj.previousBalance,
        newBalance: adj.newBalance,
        adjustedBy: adj.adjustedBy,
        adjustedByName: adj.adjustedByUser.name,
        createdAt: adj.createdAt,
      }));
    } catch (error) {
      console.error(
        "[BalanceAdjustmentService] Error getting adjustments by admin:",
        error
      );
      return [];
    }
  }

  /**
   * Get all recent adjustments (system-wide)
   */
  static async getRecentAdjustments(
    limit: number = 100
  ): Promise<AdjustmentHistory[]> {
    try {
      const adjustments = await prisma.balanceAdjustment.findMany({
        include: {
          user: {
            select: { name: true },
          },
          adjustedByUser: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      return adjustments.map((adj) => ({
        id: adj.id,
        userId: adj.userId,
        userName: adj.user.name,
        leaveType: adj.leaveType,
        year: adj.year,
        amount: adj.amount,
        reason: adj.reason,
        previousBalance: adj.previousBalance,
        newBalance: adj.newBalance,
        adjustedBy: adj.adjustedBy,
        adjustedByName: adj.adjustedByUser.name,
        createdAt: adj.createdAt,
      }));
    } catch (error) {
      console.error(
        "[BalanceAdjustmentService] Error getting recent adjustments:",
        error
      );
      return [];
    }
  }

  /**
   * Get adjustment statistics
   */
  static async getAdjustmentStats(year?: number) {
    try {
      const whereClause = year ? { year } : {};

      const [total, byType, bySign] = await Promise.all([
        // Total adjustments
        prisma.balanceAdjustment.count({ where: whereClause }),

        // By leave type
        prisma.balanceAdjustment.groupBy({
          by: ["leaveType"],
          where: whereClause,
          _count: true,
          _sum: {
            amount: true,
          },
        }),

        // Positive vs negative
        prisma.$queryRaw<Array<{ sign: string; count: bigint }>>`
          SELECT
            CASE WHEN amount > 0 THEN 'credit' ELSE 'debit' END as sign,
            COUNT(*) as count
          FROM BalanceAdjustment
          ${year ? prisma.$queryRaw`WHERE year = ${year}` : prisma.$queryRaw``}
          GROUP BY sign
        `,
      ]);

      return {
        total,
        byType: byType.map((item) => ({
          leaveType: item.leaveType,
          count: item._count,
          totalAmount: item._sum.amount || 0,
        })),
        credits: Number(
          bySign.find((s) => s.sign === "credit")?.count || 0
        ),
        debits: Number(bySign.find((s) => s.sign === "debit")?.count || 0),
      };
    } catch (error) {
      console.error(
        "[BalanceAdjustmentService] Error getting stats:",
        error
      );
      return {
        total: 0,
        byType: [],
        credits: 0,
        debits: 0,
      };
    }
  }
}
