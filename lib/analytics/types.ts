/**
 * Analytics Types
 * Interfaces and types for advanced analytics features
 */

export interface LeaveUtilization {
  employeeId: number;
  employeeName: string;
  department: string;
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
  utilizationPercentage: number;
}

export interface LeaveTrend {
  period: string; // "2025-01", "2025-Q1", "2025"
  leaveType: string;
  totalDays: number;
  employeeCount: number;
  averageDaysPerEmployee: number;
}

export interface LeavePattern {
  employeeId: number;
  employeeName: string;
  patternType: 'monday_friday' | 'long_weekend' | 'sick_clustering' | 'holiday_adjacent';
  occurrences: number;
  confidence: number; // 0-100
  details: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface BurnoutRiskScore {
  employeeId: number;
  employeeName: string;
  department: string;
  riskScore: number; // 0-100, higher is higher risk
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    lowLeaveUtilization: boolean;
    noExtendedBreaks: boolean;
    cancelledLeaves: boolean;
    excessiveWorkHours?: boolean;
  };
  recommendations: string[];
}

export interface CostAnalysis {
  period: string;
  totalLeaveCost: number;
  encashmentLiability: number;
  lwpSavings: number;
  replacementCosts: number;
  netImpact: number;
  breakdown: {
    department: string;
    cost: number;
    employeeCount: number;
  }[];
}

export interface ForecastResult {
  period: string;
  forecastedLeaveDays: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  seasonalFactor: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  leaveType?: string;
  employeeId?: number;
}
