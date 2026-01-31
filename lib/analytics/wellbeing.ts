import { prisma } from '@/lib/prisma';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { addMonths, startOfMonth, differenceInMonths } from 'date-fns';
import type { BurnoutRiskScore } from './types';

/**
 * Employee Wellbeing & Burnout Risk Analyzer
 * Identifies employees at risk of burnout based on leave patterns
 */
export class WellbeingAnalyzer {
  /**
   * Calculate burnout risk score for all employees
   */
  static async calculateBurnoutRisk(
    department?: string
  ): Promise<BurnoutRiskScore[]> {
    const currentYear = new Date().getFullYear();
    const sixMonthsAgo = addMonths(new Date(), -6);

    // Get all employees with their leave data
    const employees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        ...(department && { department }),
      },
      select: {
        id: true,
        name: true,
        department: true,
        leaves: {
          where: {
            status: LeaveStatus.APPROVED,
            startDate: {
              gte: sixMonthsAgo,
            },
          },
          select: {
            type: true,
            workingDays: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        balances: {
          where: {
            year: currentYear,
          },
          select: {
            type: true,
            opening: true,
            accrued: true,
            used: true,
            closing: true,
          },
        },
      },
    });

    const riskScores: BurnoutRiskScore[] = [];

    for (const employee of employees) {
      const score = this.calculateIndividualRiskScore(employee);
      if (score.riskScore > 0) {
        riskScores.push(score);
      }
    }

    return riskScores.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Calculate risk score for individual employee
   */
  private static calculateIndividualRiskScore(employee: any): BurnoutRiskScore {
    let riskScore = 0;
    const factors = {
      lowLeaveUtilization: false,
      noExtendedBreaks: false,
      cancelledLeaves: false,
    };
    const recommendations: string[] = [];

    // Factor 1: Low leave utilization (<50% of allocated)
    const earnedBalance = employee.balances.find((b: any) => b.type === LeaveType.EARNED);
    if (earnedBalance) {
      const allocated = earnedBalance.opening + earnedBalance.accrued;
      const utilization = allocated > 0 ? (earnedBalance.used / allocated) * 100 : 0;

      if (utilization < 50) {
        factors.lowLeaveUtilization = true;
        riskScore += 30;
        recommendations.push(
          `Take advantage of your unused leave balance (${earnedBalance.closing} days remaining)`
        );
      }
    }

    // Factor 2: No extended breaks (>3 consecutive days) in last 6 months
    const hasExtendedBreak = employee.leaves.some((leave: any) => leave.workingDays > 3);

    if (!hasExtendedBreak && employee.leaves.length > 0) {
      factors.noExtendedBreaks = true;
      riskScore += 35;
      recommendations.push(
        'Consider taking an extended break (4+ days) to fully recharge'
      );
    }

    // Factor 3: No leave taken in last 6 months
    if (employee.leaves.length === 0) {
      riskScore += 35;
      recommendations.push(
        'You haven\'t taken any leave in 6 months. Please prioritize taking time off for your wellbeing.'
      );
    }

    // Factor 4: Only taking 1-day leaves (no proper rest)
    const onlyShortLeaves =
      employee.leaves.length > 0 &&
      employee.leaves.every((leave: any) => leave.workingDays <= 1);

    if (onlyShortLeaves) {
      riskScore += 20;
      recommendations.push(
        'Consider taking longer breaks for better recovery'
      );
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore >= 70) {
      riskLevel = 'high';
      recommendations.unshift('HIGH PRIORITY: Schedule a wellness check-in with your manager');
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department || 'Unassigned',
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      factors,
      recommendations,
    };
  }

  /**
   * Get high-risk employees (score >= 70)
   */
  static async getHighRiskEmployees(
    department?: string
  ): Promise<BurnoutRiskScore[]> {
    const allScores = await this.calculateBurnoutRisk(department);
    return allScores.filter((score) => score.riskScore >= 70);
  }

  /**
   * Get recommendations for improving team wellbeing
   */
  static generateTeamRecommendations(scores: BurnoutRiskScore[]): string[] {
    const recommendations: string[] = [];
    const highRiskCount = scores.filter((s) => s.riskLevel === 'high').length;
    const mediumRiskCount = scores.filter((s) => s.riskLevel === 'medium').length;
    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.riskScore, 0) / scores.length
        : 0;

    if (highRiskCount > 0) {
      recommendations.push(
        `${highRiskCount} employee(s) at HIGH burnout risk. Immediate intervention recommended.`
      );
    }

    if (mediumRiskCount > 0) {
      recommendations.push(
        `${mediumRiskCount} employee(s) at MEDIUM burnout risk. Schedule check-ins.`
      );
    }

    if (avgScore > 50) {
      recommendations.push(
        'Team average burnout risk is high. Consider implementing team-wide wellness initiatives.'
      );
    }

    const lowUtilizers = scores.filter(
      (s) => s.factors.lowLeaveUtilization
    ).length;
    if (lowUtilizers > scores.length * 0.3) {
      recommendations.push(
        `${lowUtilizers} employees have low leave utilization. Encourage taking regular breaks.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Team wellbeing metrics are healthy. Continue current practices.');
    }

    return recommendations;
  }
}
