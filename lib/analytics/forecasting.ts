import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';
import { addMonths, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';
import type { ForecastResult } from './types';

/**
 * Leave Forecasting Engine
 * Predicts future leave trends using historical data
 */
export class LeaveForecast {
  /**
   * Forecast leave volume for next N months
   * Uses simple moving average with seasonal adjustment
   */
  static async forecastLeaveVolume(
    monthsAhead: number = 3,
    department?: string
  ): Promise<ForecastResult[]> {
    // Get historical data (last 12 months)
    const now = new Date();
    const startDate = addMonths(startOfMonth(now), -12);
    const endDate = endOfMonth(now);

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(department && {
          requester: {
            department,
          },
        }),
      },
      select: {
        startDate: true,
        workingDays: true,
      },
    });

    // Group by month
    const monthlyData = new Map<string, number>();

    for (const leave of leaves) {
      const monthKey = `${leave.startDate.getFullYear()}-${String(leave.startDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + leave.workingDays);
    }

    // Calculate moving average
    const values = Array.from(monthlyData.values());
    const movingAverage = values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : 0;

    // Calculate standard deviation for confidence interval
    const variance =
      values.length > 0
        ? values.reduce((sum, val) => sum + Math.pow(val - movingAverage, 2), 0) / values.length
        : 0;
    const stdDev = Math.sqrt(variance);

    // Detect seasonal patterns
    const seasonalFactors = this.calculateSeasonalFactors(monthlyData);

    // Generate forecasts
    const forecasts: ForecastResult[] = [];

    for (let i = 1; i <= monthsAhead; i++) {
      const forecastMonth = addMonths(startOfMonth(now), i);
      const monthKey = `${forecastMonth.getFullYear()}-${String(forecastMonth.getMonth() + 1).padStart(2, '0')}`;
      const seasonalFactor = seasonalFactors.get(forecastMonth.getMonth()) || 1;

      const forecastedValue = movingAverage * seasonalFactor;

      // Determine trend
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (values.length >= 3) {
        const recentAvg = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
        const olderAvg = values.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;

        if (recentAvg > olderAvg * 1.1) trend = 'increasing';
        else if (recentAvg < olderAvg * 0.9) trend = 'decreasing';
      }

      forecasts.push({
        period: monthKey,
        forecastedLeaveDays: Math.round(forecastedValue),
        confidenceInterval: {
          lower: Math.max(0, Math.round(forecastedValue - stdDev * 1.96)),
          upper: Math.round(forecastedValue + stdDev * 1.96),
        },
        seasonalFactor: Math.round(seasonalFactor * 100) / 100,
        trend,
      });
    }

    return forecasts;
  }

  /**
   * Calculate seasonal factors by month (0-11)
   */
  private static calculateSeasonalFactors(
    monthlyData: Map<string, number>
  ): Map<number, number> {
    const monthAverages = new Map<number, number[]>();

    // Group by month of year
    monthlyData.forEach((days, monthKey) => {
      const [year, month] = monthKey.split('-');
      const monthNum = parseInt(month) - 1; // 0-based

      if (!monthAverages.has(monthNum)) {
        monthAverages.set(monthNum, []);
      }
      monthAverages.get(monthNum)!.push(days);
    });

    // Calculate average for each month
    const seasonalFactors = new Map<number, number>();
    const overallAvg =
      Array.from(monthlyData.values()).reduce((sum, val) => sum + val, 0) /
      monthlyData.size;

    for (let month = 0; month < 12; month++) {
      const values = monthAverages.get(month) || [];
      if (values.length > 0) {
        const monthAvg = values.reduce((sum, val) => sum + val, 0) / values.length;
        seasonalFactors.set(month, monthAvg / overallAvg);
      } else {
        seasonalFactors.set(month, 1);
      }
    }

    return seasonalFactors;
  }

  /**
   * Identify peak leave periods in historical data
   */
  static async identifyPeakPeriods(
    lookbackMonths: number = 12,
    department?: string
  ): Promise<
    {
      period: string;
      leaveDays: number;
      percentageAboveAverage: number;
    }[]
  > {
    const now = new Date();
    const startDate = addMonths(startOfMonth(now), -lookbackMonths);

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: {
          gte: startDate,
        },
        ...(department && {
          requester: {
            department,
          },
        }),
      },
      select: {
        startDate: true,
        workingDays: true,
      },
    });

    // Group by month
    const monthlyData = new Map<string, number>();

    for (const leave of leaves) {
      const monthKey = `${leave.startDate.getFullYear()}-${String(leave.startDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + leave.workingDays);
    }

    // Calculate average
    const values = Array.from(monthlyData.values());
    const average = values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : 0;

    // Find peaks (months with >20% above average)
    const peaks = Array.from(monthlyData.entries())
      .filter(([_, days]) => days > average * 1.2)
      .map(([period, days]) => ({
        period,
        leaveDays: days,
        percentageAboveAverage: Math.round(((days - average) / average) * 100),
      }))
      .sort((a, b) => b.leaveDays - a.leaveDays);

    return peaks;
  }
}
