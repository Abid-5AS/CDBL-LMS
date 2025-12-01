import { prisma } from "@/lib/prisma";
import { LeaveType, LeaveStatus } from "@prisma/client";
import {
  addMonths,
  differenceInMonths,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
  format,
} from "date-fns";

export interface MonthlyProjection {
  month: string; // "2025-01"
  monthLabel: string; // "January 2025"
  opening: number;
  accrued: number;
  used: number;
  planned: number; // Pending/approved future leaves
  projected: number; // What balance will be at end of month
  expiring: number; // Amount that will expire if not used
}

export interface BalanceProjectionResult {
  leaveType: LeaveType;
  currentBalance: number;
  projections: MonthlyProjection[];
  warnings: {
    type: "expiry" | "deficit" | "underutilization";
    message: string;
    severity: "info" | "warning" | "error";
  }[];
  recommendations: string[];
}

export interface AccrualRules {
  earnedPerMonth: number; // EL: 2 days/month
  casualAnnual: number; // CL: 10 days/year (no accrual)
  medicalAnnual: number; // ML: 14 days/year (no accrual)
  maxCarryForward: number; // EL: 60 days max
}

const ACCRUAL_RULES: AccrualRules = {
  earnedPerMonth: 2, // Policy 6.4
  casualAnnual: 10, // Policy 6.7
  medicalAnnual: 14, // Policy 6.11
  maxCarryForward: 60, // Policy 6.5
};

/**
 * BalanceProjectorService
 *
 * Projects future leave balances based on accrual rules and planned leaves
 */
export class BalanceProjectorService {
  /**
   * Project leave balance for future months
   */
  static async projectBalance(
    userId: number,
    leaveType: LeaveType,
    monthsAhead: number = 12
  ): Promise<BalanceProjectionResult> {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();

      // Get current balance
      const balance = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId,
            type: leaveType,
            year: currentYear,
          },
        },
      });

      if (!balance) {
        // No balance record, return empty projection
        return {
          leaveType,
          currentBalance: 0,
          projections: [],
          warnings: [
            {
              type: "deficit",
              message: "No balance record found for this leave type",
              severity: "error",
            },
          ],
          recommendations: [],
        };
      }

      const currentBalance = balance.closing;

      // Get user info for join date
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { joinDate: true },
      });

      // Get all pending/approved future leaves
      const futureLeaves = await prisma.leaveRequest.findMany({
        where: {
          requesterId: userId,
          type: leaveType,
          status: {
            in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
          },
          startDate: {
            gte: currentDate,
          },
        },
        select: {
          startDate: true,
          endDate: true,
          workingDays: true,
          status: true,
        },
        orderBy: {
          startDate: "asc",
        },
      });

      // Generate monthly projections
      const projections: MonthlyProjection[] = [];
      let runningBalance = currentBalance;

      for (let i = 0; i < monthsAhead; i++) {
        const projectionMonth = addMonths(startOfMonth(currentDate), i);
        const monthStart = startOfMonth(projectionMonth);
        const monthEnd = endOfMonth(projectionMonth);
        const monthKey = format(projectionMonth, "yyyy-MM");
        const monthLabel = format(projectionMonth, "MMMM yyyy");

        // Calculate accrual for this month
        let accrued = 0;
        if (leaveType === LeaveType.EARNED) {
          // Check if user has joined by this month
          const hasJoined = !user?.joinDate || isBefore(user.joinDate, monthEnd);
          if (hasJoined) {
            accrued = ACCRUAL_RULES.earnedPerMonth;
          }
        }
        // CL and ML don't accrue monthly - they're granted annually

        // Find leaves that will be used in this month
        const leavesInMonth = futureLeaves.filter((leave) => {
          const leaveStart = leave.startDate;
          const leaveEnd = leave.endDate;

          // Leave overlaps with this month
          return (
            (isAfter(leaveStart, monthStart) || leaveStart.getTime() === monthStart.getTime()) &&
            (isBefore(leaveStart, monthEnd) || leaveStart.getTime() === monthEnd.getTime()) ||
            (isAfter(leaveEnd, monthStart) || leaveEnd.getTime() === monthStart.getTime()) &&
            (isBefore(leaveEnd, monthEnd) || leaveEnd.getTime() === monthEnd.getTime()) ||
            (isBefore(leaveStart, monthStart) && isAfter(leaveEnd, monthEnd))
          );
        });

        // Calculate days used in this month
        const used = leavesInMonth
          .filter((l) => l.status === LeaveStatus.APPROVED)
          .reduce((sum, leave) => sum + leave.workingDays, 0);

        const planned = leavesInMonth
          .filter((l) => l.status === LeaveStatus.PENDING)
          .reduce((sum, leave) => sum + leave.workingDays, 0);

        // Calculate projected balance
        const opening = runningBalance;
        const projected = opening + accrued - used - planned;

        // Check for expiry (EL only, at year end)
        let expiring = 0;
        if (
          leaveType === LeaveType.EARNED &&
          monthEnd.getMonth() === 11 // December
        ) {
          const excessBalance = projected - ACCRUAL_RULES.maxCarryForward;
          if (excessBalance > 0) {
            expiring = excessBalance;
          }
        }

        projections.push({
          month: monthKey,
          monthLabel,
          opening,
          accrued,
          used,
          planned,
          projected,
          expiring,
        });

        // Update running balance for next iteration
        runningBalance = projected - expiring;
      }

      // Generate warnings and recommendations
      const warnings = this.generateWarnings(
        leaveType,
        currentBalance,
        projections
      );
      const recommendations = this.generateRecommendations(
        leaveType,
        currentBalance,
        projections
      );

      return {
        leaveType,
        currentBalance,
        projections,
        warnings,
        recommendations,
      };
    } catch (error) {
      console.error("[BalanceProjectorService] Error projecting balance:", error);
      throw error;
    }
  }

  /**
   * Generate warnings based on projections
   */
  private static generateWarnings(
    leaveType: LeaveType,
    currentBalance: number,
    projections: MonthlyProjection[]
  ): {
    type: "expiry" | "deficit" | "underutilization";
    message: string;
    severity: "info" | "warning" | "error";
  }[] {
    const warnings: {
      type: "expiry" | "deficit" | "underutilization";
      message: string;
      severity: "info" | "warning" | "error";
    }[] = [];

    // Check for expiry
    const expiringMonths = projections.filter((p) => p.expiring > 0);
    if (expiringMonths.length > 0) {
      const totalExpiring = expiringMonths.reduce(
        (sum, p) => sum + p.expiring,
        0
      );
      warnings.push({
        type: "expiry",
        message: `${totalExpiring} days of ${leaveType} will expire if not used by year end`,
        severity: "warning",
      });
    }

    // Check for deficit
    const deficitMonths = projections.filter((p) => p.projected < 0);
    if (deficitMonths.length > 0) {
      warnings.push({
        type: "deficit",
        message: `Projected ${leaveType} balance will be negative in ${deficitMonths[0].monthLabel}`,
        severity: "error",
      });
    }

    // Check for underutilization (EL only)
    if (leaveType === LeaveType.EARNED) {
      const lastProjection = projections[projections.length - 1];
      if (lastProjection && lastProjection.projected > ACCRUAL_RULES.maxCarryForward) {
        warnings.push({
          type: "underutilization",
          message: `You have high ${leaveType} balance. Consider planning leaves to avoid loss.`,
          severity: "info",
        });
      }
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    leaveType: LeaveType,
    currentBalance: number,
    projections: MonthlyProjection[]
  ): string[] {
    const recommendations: string[] = [];

    // Find months with expiry
    const expiringMonths = projections.filter((p) => p.expiring > 0);
    if (expiringMonths.length > 0) {
      recommendations.push(
        `Plan ${expiringMonths[0].expiring} days of leave before ${expiringMonths[0].monthLabel} to avoid losing earned leave.`
      );
    }

    // Check for low utilization
    if (leaveType === LeaveType.EARNED) {
      const monthsWithNoLeave = projections.filter(
        (p) => p.used === 0 && p.planned === 0
      );
      if (monthsWithNoLeave.length >= 6) {
        recommendations.push(
          "You haven't planned any leaves in the next 6 months. Consider scheduling time off for work-life balance."
        );
      }
    }

    // Check for deficit
    const deficitMonths = projections.filter((p) => p.projected < 0);
    if (deficitMonths.length > 0) {
      recommendations.push(
        `You have more planned leaves than available balance. Consider rescheduling or canceling some leave requests.`
      );
    }

    // General recommendation for CL/ML
    if (leaveType === LeaveType.CASUAL && currentBalance > 7) {
      recommendations.push(
        "You have high casual leave balance. Casual leaves don't carry forward to next year."
      );
    }

    if (leaveType === LeaveType.MEDICAL && currentBalance > 10) {
      recommendations.push(
        "You have significant medical leave balance. Medical leaves don't carry forward to next year."
      );
    }

    return recommendations;
  }

  /**
   * Calculate what balance will be after a hypothetical leave
   */
  static async calculateBalanceAfterLeave(
    userId: number,
    leaveType: LeaveType,
    workingDays: number
  ): Promise<{ before: number; after: number; willBeNegative: boolean }> {
    try {
      const currentYear = new Date().getFullYear();

      const balance = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId,
            type: leaveType,
            year: currentYear,
          },
        },
      });

      const before = balance?.closing || 0;
      const after = before - workingDays;

      return {
        before,
        after,
        willBeNegative: after < 0,
      };
    } catch (error) {
      console.error(
        "[BalanceProjectorService] Error calculating balance after leave:",
        error
      );
      throw error;
    }
  }
}
