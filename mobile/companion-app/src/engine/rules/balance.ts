import type { Rule, ValidationContext, RuleResult } from "../../types";

/**
 * Balance Rules
 *
 * - Check if sufficient leave balance is available
 * - Warn if balance is low after this request
 * - Block if balance is insufficient
 */

export const balanceRules: Rule[] = [
  {
    id: "BAL_001",
    name: "Sufficient Balance Check",
    description: "Ensure sufficient leave balance is available",
    leaveTypes: ["ALL"],
    priority: 100,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, balance } = context;
      const { type, workingDays = 0 } = leaveRequest;

      if (!balance) {
        return {
          passed: true,
          severity: "WARNING",
          code: "BAL_NOT_AVAILABLE",
          message: "Balance information not available. Unable to verify.",
        };
      }

      const { available } = balance;

      if (workingDays > available) {
        return {
          passed: false,
          severity: "ERROR",
          code: "BAL_INSUFFICIENT",
          message: `Insufficient ${type} balance. Available: ${available} days, Requested: ${workingDays} days.`,
          suggestions: [
            {
              type: "REDUCE_DAYS",
              reasoning: `Reduce your request to ${available} days or less to match your available balance.`,
              priority: 100,
            },
            {
              type: "ALTERNATIVE_LEAVE_TYPE",
              leaveType: "EARNED",
              reasoning:
                "Check if you have balance in other leave types like Earned Leave or Medical Leave.",
              priority: 80,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "BAL_SUFFICIENT",
        message: `Balance check passed. Available: ${available} days, Requested: ${workingDays} days.`,
      };
    },
    explain: (context: ValidationContext): string => {
      const { balance, leaveRequest } = context;
      const { workingDays = 0 } = leaveRequest;
      const available = balance?.available || 0;
      return `Balance Policy: You must have sufficient leave balance. Available: ${available} days, Requested: ${workingDays} days, Remaining after: ${available - workingDays} days.`;
    },
  },

  {
    id: "BAL_002",
    name: "Low Balance Warning",
    description: "Warn if balance will be low after this request",
    leaveTypes: ["ALL"],
    priority: 60,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, balance } = context;
      const { workingDays = 0 } = leaveRequest;

      if (!balance) {
        return {
          passed: true,
          severity: "INFO",
          code: "BAL_NOT_AVAILABLE",
          message: "Balance information not available",
        };
      }

      const { available } = balance;
      const remainingAfter = available - workingDays;

      // Warn if less than 3 days will remain
      if (remainingAfter >= 0 && remainingAfter < 3) {
        return {
          passed: true,
          severity: "WARNING",
          code: "BAL_LOW_REMAINING",
          message: `After this request, you'll have only ${remainingAfter} days remaining. Plan your leave carefully for the rest of the year.`,
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "BAL_ADEQUATE",
        message: `Healthy balance remaining: ${remainingAfter} days after this request.`,
      };
    },
    explain: (context: ValidationContext): string => {
      const { balance, leaveRequest } = context;
      const { workingDays = 0 } = leaveRequest;
      const available = balance?.available || 0;
      const remainingAfter = available - workingDays;
      return `Balance Advisory: After this request, you'll have ${remainingAfter} days remaining. It's recommended to keep at least 3 days in reserve for emergencies.`;
    },
  },

  {
    id: "BAL_003",
    name: "Pending Leaves Deduction",
    description: "Account for pending leave applications",
    leaveTypes: ["ALL"],
    priority: 95,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, balance } = context;
      const { workingDays = 0 } = leaveRequest;

      if (!balance) {
        return {
          passed: true,
          severity: "INFO",
          code: "BAL_NOT_AVAILABLE",
          message: "Balance information not available",
        };
      }

      const { available, pending } = balance;

      if (pending > 0) {
        const effectiveAvailable = available - pending;

        if (workingDays > effectiveAvailable) {
          return {
            passed: false,
            severity: "ERROR",
            code: "BAL_PENDING_OVERLAP",
            message: `You have ${pending} days pending approval. Effective available balance: ${effectiveAvailable} days. Cannot request ${workingDays} days.`,
            suggestions: [
              {
                type: "WAIT_FOR_APPROVAL",
                reasoning:
                  "Wait for your pending leave applications to be approved or rejected before submitting new requests.",
                priority: 90,
              },
            ],
          };
        }

        return {
          passed: true,
          severity: "WARNING",
          code: "BAL_PENDING_CONSIDERATION",
          message: `Note: ${pending} days are pending approval. Effective available: ${effectiveAvailable} days.`,
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "BAL_NO_PENDING",
        message: "No pending leave applications affecting balance",
      };
    },
    explain: (context: ValidationContext): string => {
      const { balance } = context;
      const pending = balance?.pending || 0;
      return `Balance Calculation: Pending leave applications (${pending} days) are deducted from available balance to prevent over-booking. Wait for pending approvals before submitting new requests.`;
    },
  },
];
