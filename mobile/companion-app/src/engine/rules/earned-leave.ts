import type { Rule, ValidationContext, RuleResult } from "../../types";
import { differenceInDays, isWeekend, isSameDay } from "date-fns";

/**
 * Earned Leave Rules
 *
 * - Max 21 consecutive days
 * - Requires 3 days advance notice
 * - Can be adjacent to holidays
 * - Accumulated monthly (1.67 days per month)
 */

export const earnedLeaveRules: Rule[] = [
  {
    id: "EL_001",
    name: "Earned Leave Max Days",
    description: "Earned leave cannot exceed 21 consecutive days",
    leaveTypes: ["EARNED", "Earned Leave"],
    priority: 100,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest } = context;
      const { workingDays = 0 } = leaveRequest;

      if (workingDays > 21) {
        return {
          passed: false,
          severity: "ERROR",
          code: "EL_MAX_DAYS_EXCEEDED",
          message: `Earned Leave cannot exceed 21 consecutive days. You requested ${workingDays} days.`,
          suggestions: [
            {
              type: "SPLIT_REQUEST",
              reasoning:
                "Split your request into multiple Earned Leave requests with gaps in between to stay within the 21-day limit.",
              priority: 85,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "EL_MAX_DAYS_OK",
        message: "Earned leave duration is within limits",
      };
    },
    explain: (context: ValidationContext): string => {
      const { workingDays = 0 } = context.leaveRequest;
      return `Earned Leave Policy: Maximum 21 consecutive days allowed. Your request: ${workingDays} days. This limit ensures work continuity while allowing substantial time off.`;
    },
  },

  {
    id: "EL_002",
    name: "Earned Leave Advance Notice",
    description: "Earned leave requires 3 days advance notice",
    leaveTypes: ["EARNED", "Earned Leave"],
    priority: 90,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, currentDate } = context;
      const { startDate } = leaveRequest;

      if (!startDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "EL_START_DATE_NOT_SET",
          message: "Start date not set yet",
        };
      }

      const daysInAdvance = differenceInDays(startDate, currentDate);

      if (daysInAdvance < 3) {
        return {
          passed: false,
          severity: "ERROR",
          code: "EL_INSUFFICIENT_NOTICE",
          message: `Earned Leave requires 3 days advance notice. You're submitting with ${daysInAdvance} days notice.`,
          suggestions: [
            {
              type: "ALTERNATIVE_LEAVE_TYPE",
              leaveType: "MEDICAL",
              reasoning:
                "If this is urgent due to illness, consider using Medical Leave which allows same-day requests.",
              priority: 70,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "EL_NOTICE_OK",
        message: "Advance notice requirement met",
      };
    },
    explain: (context: ValidationContext): string => {
      const { startDate } = context.leaveRequest;
      const daysInAdvance = startDate
        ? differenceInDays(startDate, context.currentDate)
        : 0;
      return `Earned Leave Policy: Minimum 3 days advance notice required. Your request: ${daysInAdvance} days in advance. This allows proper handover and coverage planning.`;
    },
  },

  {
    id: "EL_003",
    name: "Earned Leave Weekend/Holiday Validation",
    description: "EL start and end dates cannot be weekends or holidays",
    leaveTypes: ["EARNED", "Earned Leave"],
    priority: 85,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, holidays } = context;
      const { startDate, endDate } = leaveRequest;

      if (!startDate || !endDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "EL_DATES_NOT_SET",
          message: "Dates not set yet",
        };
      }

      const holidayDates = holidays.map((h) => h.date);
      const isStartWeekend = isWeekend(startDate);
      const isEndWeekend = isWeekend(endDate);
      const isStartHoliday = holidayDates.some((hDate) =>
        isSameDay(hDate, startDate)
      );
      const isEndHoliday = holidayDates.some((hDate) =>
        isSameDay(hDate, endDate)
      );

      if (isStartWeekend || isStartHoliday) {
        return {
          passed: false,
          severity: "ERROR",
          code: "EL_START_WEEKEND_HOLIDAY",
          message:
            "Earned Leave cannot start on a weekend or holiday. Please choose a working day.",
        };
      }

      if (isEndWeekend || isEndHoliday) {
        return {
          passed: false,
          severity: "ERROR",
          code: "EL_END_WEEKEND_HOLIDAY",
          message:
            "Earned Leave cannot end on a weekend or holiday. Please choose a working day.",
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "EL_WEEKEND_HOLIDAY_OK",
        message: "Start and end dates are valid working days",
      };
    },
    explain: (context: ValidationContext): string => {
      return "Earned Leave Policy: Start and end dates must be working days. However, EL can be adjacent to holidays, allowing you to extend your time off by combining with weekends/holidays.";
    },
  },

  {
    id: "EL_004",
    name: "Earned Leave Long Duration Warning",
    description: "Warning for EL requests longer than 10 days",
    leaveTypes: ["EARNED", "Earned Leave"],
    priority: 50,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest } = context;
      const { workingDays = 0 } = leaveRequest;

      if (workingDays > 10) {
        return {
          passed: true,
          severity: "WARNING",
          code: "EL_LONG_DURATION",
          message: `You're requesting ${workingDays} days of Earned Leave. Ensure proper handover and documentation is completed before your leave starts.`,
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "EL_DURATION_OK",
        message: "Leave duration is reasonable",
      };
    },
    explain: (context: ValidationContext): string => {
      return "Earned Leave Policy: For leaves longer than 10 days, ensure proper handover documentation is prepared. Discuss with your manager about coverage during your absence.";
    },
  },
];
