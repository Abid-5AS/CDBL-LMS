import type { Rule, ValidationContext, RuleResult } from "../../types";
import { differenceInDays, isAfter, isBefore, isValid } from "date-fns";

/**
 * Date Validation Rules
 *
 * - Start date must be before or equal to end date
 * - Dates must be valid
 * - Cannot apply for dates too far in the future
 * - Working days calculation validation
 */

export const dateRules: Rule[] = [
  {
    id: "DATE_001",
    name: "Valid Date Format",
    description: "Ensure dates are valid",
    leaveTypes: ["ALL"],
    priority: 100,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest } = context;
      const { startDate, endDate } = leaveRequest;

      if (!startDate || !endDate) {
        return {
          passed: false,
          severity: "ERROR",
          code: "DATE_REQUIRED",
          message: "Start date and end date are required",
        };
      }

      if (!isValid(startDate)) {
        return {
          passed: false,
          severity: "ERROR",
          code: "DATE_INVALID_START",
          message: "Start date is invalid",
        };
      }

      if (!isValid(endDate)) {
        return {
          passed: false,
          severity: "ERROR",
          code: "DATE_INVALID_END",
          message: "End date is invalid",
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "DATE_VALID",
        message: "Dates are valid",
      };
    },
    explain: (context: ValidationContext): string => {
      return "Date Validation: Both start and end dates must be valid dates in the format YYYY-MM-DD.";
    },
  },

  {
    id: "DATE_002",
    name: "Date Range Validation",
    description: "Start date must be before or equal to end date",
    leaveTypes: ["ALL"],
    priority: 99,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest } = context;
      const { startDate, endDate } = leaveRequest;

      if (!startDate || !endDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "DATE_NOT_SET",
          message: "Dates not set yet",
        };
      }

      if (isAfter(startDate, endDate)) {
        return {
          passed: false,
          severity: "ERROR",
          code: "DATE_RANGE_INVALID",
          message: "Start date must be before or equal to end date",
          suggestions: [
            {
              type: "SWAP_DATES",
              reasoning: "The dates appear to be reversed. Please check and correct the start and end dates.",
              priority: 100,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "DATE_RANGE_VALID",
        message: "Date range is valid",
      };
    },
    explain: (context: ValidationContext): string => {
      return "Date Range Policy: Start date must be before or equal to end date. For single-day leave, use the same date for both start and end.";
    },
  },

  {
    id: "DATE_003",
    name: "Future Date Limit",
    description: "Cannot apply for leaves more than 90 days in advance",
    leaveTypes: ["ALL"],
    priority: 70,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, currentDate } = context;
      const { startDate } = leaveRequest;

      if (!startDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "DATE_NOT_SET",
          message: "Start date not set yet",
        };
      }

      const daysInAdvance = differenceInDays(startDate, currentDate);

      if (daysInAdvance > 90) {
        return {
          passed: false,
          severity: "ERROR",
          code: "DATE_TOO_FAR_FUTURE",
          message: `Leave cannot be applied more than 90 days in advance. You're trying to apply ${daysInAdvance} days ahead.`,
          suggestions: [
            {
              type: "WAIT",
              reasoning: "Please wait until you're within the 90-day window to submit this leave request.",
              priority: 80,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "DATE_ADVANCE_OK",
        message: "Leave application timing is appropriate",
      };
    },
    explain: (context: ValidationContext): string => {
      const { startDate } = context.leaveRequest;
      const daysInAdvance = startDate
        ? differenceInDays(startDate, context.currentDate)
        : 0;
      return `Date Policy: Leave can be applied up to 90 days in advance. Your request: ${daysInAdvance} days ahead. This policy ensures planning is done within a reasonable timeframe.`;
    },
  },

  {
    id: "DATE_004",
    name: "Working Days Calculation",
    description: "Validate working days calculation",
    leaveTypes: ["ALL"],
    priority: 85,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest } = context;
      const { startDate, endDate, workingDays = 0 } = leaveRequest;

      if (!startDate || !endDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "DATE_NOT_SET",
          message: "Dates not set yet",
        };
      }

      if (workingDays <= 0) {
        return {
          passed: false,
          severity: "ERROR",
          code: "WORKING_DAYS_INVALID",
          message: "Working days must be greater than 0. Please select valid working days.",
          suggestions: [
            {
              type: "CHECK_DATES",
              reasoning: "Ensure your selected dates include at least one working day (Monday-Friday, excluding holidays).",
              priority: 90,
            },
          ],
        };
      }

      const totalDays = differenceInDays(endDate, startDate) + 1;

      if (workingDays > totalDays) {
        return {
          passed: false,
          severity: "ERROR",
          code: "WORKING_DAYS_EXCEEDS_TOTAL",
          message: `Working days (${workingDays}) cannot exceed total days (${totalDays}) in the range.`,
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "WORKING_DAYS_VALID",
        message: `Working days calculation is correct: ${workingDays} days.`,
      };
    },
    explain: (context: ValidationContext): string => {
      const { workingDays = 0 } = context.leaveRequest;
      return `Working Days Calculation: Only working days (Monday-Friday, excluding public holidays) are counted. Your request: ${workingDays} working days. Weekends and holidays are automatically excluded.`;
    },
  },

  {
    id: "DATE_005",
    name: "Date Overlap Check",
    description: "Check for overlapping leave applications",
    leaveTypes: ["ALL"],
    priority: 95,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, existingLeaves = [] } = context;
      const { startDate, endDate, id } = leaveRequest;

      if (!startDate || !endDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "DATE_NOT_SET",
          message: "Dates not set yet",
        };
      }

      // Check for overlaps with existing leaves (excluding current leave if editing)
      const overlaps = existingLeaves.filter((existing) => {
        // Skip if it's the same leave (editing case)
        if (existing.id === id) return false;

        // Skip cancelled or rejected leaves
        if (
          existing.status === "cancelled" ||
          existing.status === "rejected"
        ) {
          return false;
        }

        const existingStart = new Date(existing.startDate);
        const existingEnd = new Date(existing.endDate);

        // Check for overlap
        return (
          (isBefore(startDate, existingEnd) || startDate.getTime() === existingEnd.getTime()) &&
          (isAfter(endDate, existingStart) || endDate.getTime() === existingStart.getTime())
        );
      });

      if (overlaps.length > 0) {
        const overlapDetails = overlaps.map(
          (o) =>
            `${o.type} from ${new Date(o.startDate).toLocaleDateString()} to ${new Date(o.endDate).toLocaleDateString()} (${o.status})`
        );

        return {
          passed: false,
          severity: "ERROR",
          code: "DATE_OVERLAP",
          message: `Your requested dates overlap with existing leave application(s): ${overlapDetails.join(", ")}`,
          suggestions: [
            {
              type: "CHANGE_DATES",
              reasoning: "Choose different dates that don't overlap with your existing leave applications.",
              priority: 100,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "DATE_NO_OVERLAP",
        message: "No overlapping leave applications found",
      };
    },
    explain: (context: ValidationContext): string => {
      return "Date Overlap Policy: You cannot have multiple leave applications for the same dates. Cancel or modify existing leaves before submitting a new request for overlapping dates.";
    },
  },
];
