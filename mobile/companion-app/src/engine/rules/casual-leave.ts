import type { Rule, ValidationContext, RuleResult } from "../../types";
import { differenceInDays, isWeekend, isSameDay } from "date-fns";

/**
 * Casual Leave Rules
 *
 * - Max 3 consecutive days
 * - Cannot be adjacent to holidays
 * - Min 5 days advance notice (soft warning)
 * - No carry-forward (resets every year)
 */

export const casualLeaveRules: Rule[] = [
  {
    id: "CL_001",
    name: "Casual Leave Max Days",
    description: "Casual leave cannot exceed 3 consecutive days",
    leaveTypes: ["CASUAL"],
    priority: 100,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest } = context;
      const { workingDays = 0 } = leaveRequest;

      if (workingDays > 3) {
        return {
          passed: false,
          severity: "ERROR",
          code: "CL_MAX_DAYS_EXCEEDED",
          message: `Casual Leave cannot exceed 3 consecutive days. You requested ${workingDays} days.`,
          suggestions: [
            {
              type: "ALTERNATIVE_LEAVE_TYPE",
              leaveType: "EARNED",
              reasoning:
                "Consider using Earned Leave for longer durations. EL allows continuous time off without the 3-day limit.",
              priority: 90,
            },
            {
              type: "SPLIT_REQUEST",
              reasoning:
                "Split your request into multiple Casual Leave requests of 3 days or less with gaps in between.",
              priority: 70,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "CL_MAX_DAYS_OK",
        message: "Casual leave duration is within limits",
      };
    },
    explain: (context: ValidationContext): string => {
      const { workingDays = 0 } = context.leaveRequest;
      return `Casual Leave Policy: Maximum 3 consecutive days allowed. Your request: ${workingDays} days. Consider using Earned Leave (EL) for longer periods.`;
    },
  },

  {
    id: "CL_002",
    name: "Casual Leave Holiday Adjacency",
    description: "Casual leave cannot be adjacent to holidays",
    leaveTypes: ["CASUAL"],
    priority: 95,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, holidays } = context;
      const { startDate, endDate } = leaveRequest;

      if (!startDate || !endDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "CL_DATES_NOT_SET",
          message: "Dates not set yet",
        };
      }

      // Check if start date - 1 or end date + 1 is a holiday
      const dayBeforeStart = new Date(startDate);
      dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);

      const dayAfterEnd = new Date(endDate);
      dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);

      const holidayDates = holidays.map((h) => h.date);

      const isAdjacentToHoliday =
        holidayDates.some((hDate) => isSameDay(hDate, dayBeforeStart)) ||
        holidayDates.some((hDate) => isSameDay(hDate, dayAfterEnd));

      if (isAdjacentToHoliday) {
        return {
          passed: false,
          severity: "ERROR",
          code: "CL_HOLIDAY_ADJACENT",
          message:
            "Casual Leave cannot be adjacent to public holidays. Please choose different dates or use Earned Leave.",
          suggestions: [
            {
              type: "ALTERNATIVE_LEAVE_TYPE",
              leaveType: "EARNED",
              reasoning:
                "Use Earned Leave instead. EL can be adjacent to holidays and allows you to extend your time off.",
              priority: 95,
            },
            {
              type: "CHANGE_DATES",
              reasoning:
                "Adjust your dates to avoid being adjacent to the holiday. Leave a gap between your leave and the holiday.",
              priority: 85,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "CL_HOLIDAY_ADJACENCY_OK",
        message: "Casual leave is not adjacent to holidays",
      };
    },
    explain: (context: ValidationContext): string => {
      return 'Casual Leave Policy: Cannot be taken immediately before or after a public holiday. This prevents "holiday side-touching" to extend time off. Use Earned Leave if you need to take leave around holidays.';
    },
  },

  {
    id: "CL_003",
    name: "Casual Leave Advance Notice",
    description:
      "Casual leave should have 5 days advance notice (soft warning)",
    leaveTypes: ["CASUAL"],
    priority: 50,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, currentDate } = context;
      const { startDate } = leaveRequest;

      if (!startDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "CL_START_DATE_NOT_SET",
          message: "Start date not set yet",
        };
      }

      const daysInAdvance = differenceInDays(startDate, currentDate);

      if (daysInAdvance < 5) {
        return {
          passed: true, // Not a hard block, just a warning
          severity: "WARNING",
          code: "CL_SHORT_NOTICE",
          message: `Casual Leave Policy recommends 5 days advance notice. You're submitting with ${daysInAdvance} days notice. Your manager may need additional justification.`,
          suggestions: [
            {
              type: "ALTERNATIVE_LEAVE_TYPE",
              leaveType: "MEDICAL",
              reasoning:
                "If this is due to illness, consider using Medical Leave instead, which allows same-day or backdated requests.",
              priority: 60,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "CL_NOTICE_OK",
        message: "Advance notice requirement met",
      };
    },
    explain: (context: ValidationContext): string => {
      const { startDate } = context.leaveRequest;
      const daysInAdvance = startDate
        ? differenceInDays(startDate, context.currentDate)
        : 0;
      return `Casual Leave Policy: 5 days advance notice recommended (soft rule). Your request: ${daysInAdvance} days in advance. This is a courtesy to allow your manager time to plan coverage.`;
    },
  },

  {
    id: "CL_004",
    name: "Casual Leave Weekend/Holiday Validation",
    description: "CL start and end dates cannot be weekends or holidays",
    leaveTypes: ["CASUAL"],
    priority: 90,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, holidays } = context;
      const { startDate, endDate } = leaveRequest;

      if (!startDate || !endDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "CL_DATES_NOT_SET",
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
          code: "CL_START_WEEKEND_HOLIDAY",
          message:
            "Casual Leave cannot start on a weekend or holiday. Please choose a working day.",
        };
      }

      if (isEndWeekend || isEndHoliday) {
        return {
          passed: false,
          severity: "ERROR",
          code: "CL_END_WEEKEND_HOLIDAY",
          message:
            "Casual Leave cannot end on a weekend or holiday. Please choose a working day.",
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "CL_WEEKEND_HOLIDAY_OK",
        message: "Start and end dates are valid working days",
      };
    },
    explain: (context: ValidationContext): string => {
      return "Casual Leave Policy: Start and end dates must be working days (not weekends or holidays). This ensures CL is used only for working time off.";
    },
  },
];
