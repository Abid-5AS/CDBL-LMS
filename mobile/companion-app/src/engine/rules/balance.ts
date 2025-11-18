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
    leaveTypes: ["EARNED", "CASUAL", "MEDICAL", "MATERNITY", "PATERNITY", "STUDY", "SPECIAL", "SPECIAL_DISABILITY", "QUARANTINE", "EXTRAWITHPAY", "EXTRAWITHOUTPAY"],
    priority: 100,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, currentBalance } = context;
      const { type, workingDays = 0 } = leaveRequest;

      if (!currentBalance) {
        return {
          passed: true,
          severity: "WARNING",
          code: "BAL_NOT_AVAILABLE",
          message: "Balance information not available. Unable to verify.",
        };
      }

      // Get the balance for the requested leave type
      const requestedBalance = currentBalance[type];
      if (!requestedBalance) {
        return {
          passed: false,
          severity: "ERROR",
          code: "BAL_TYPE_NOT_FOUND",
          message: `Balance for ${type} not found.`,
        };
      }

      // Calculate available balance (closing - used + pending)
      const available = requestedBalance.closing - requestedBalance.used;

      if (workingDays > available) {
        return {
          passed: false,
          severity: "ERROR",
          code: "BAL_INSUFFICIENT",
          message: `Insufficient ${type} balance. Available: ${available} days, Requested: ${workingDays} days.`,
          suggestions: [
            {
              type: "SPLIT_REQUEST",
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
      const { currentBalance, leaveRequest } = context;
      const { type, workingDays = 0 } = leaveRequest;
      const requestedBalance = currentBalance?.[type];
      const available = requestedBalance ? requestedBalance.closing - requestedBalance.used : 0;
      return `Balance Policy: You must have sufficient leave balance. Available: ${available} days, Requested: ${workingDays} days, Remaining after: ${available - workingDays} days.`;
    },
  },

  {
    id: "BAL_002",
    name: "Low Balance Warning",
    description: "Warn if balance will be low after this request",
    leaveTypes: ["EARNED", "CASUAL", "MEDICAL", "MATERNITY", "PATERNITY", "STUDY", "SPECIAL", "SPECIAL_DISABILITY", "QUARANTINE", "EXTRAWITHPAY", "EXTRAWITHOUTPAY"],
    priority: 60,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, currentBalance } = context;
      const { type, workingDays = 0 } = leaveRequest;

      if (!currentBalance) {
        return {
          passed: true,
          severity: "INFO",
          code: "BAL_NOT_AVAILABLE",
          message: "Balance information not available",
        };
      }

      const requestedBalance = currentBalance[type];
      if (!requestedBalance) {
        return {
          passed: true,
          severity: "INFO",
          code: "BAL_TYPE_NOT_FOUND",
          message: `Balance for ${type} not found`,
        };
      }

      const available = requestedBalance.closing - requestedBalance.used;
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
      const { currentBalance, leaveRequest } = context;
      const { type, workingDays = 0 } = leaveRequest;
      const requestedBalance = currentBalance?.[type];
      const available = requestedBalance ? requestedBalance.closing - requestedBalance.used : 0;
      const remainingAfter = available - workingDays;
      return `Balance Advisory: After this request, you'll have ${remainingAfter} days remaining. It's recommended to keep at least 3 days in reserve for emergencies.`;
    },
  },

  {
    id: "BAL_003",
    name: "Pending Leaves Deduction",
    description: "Account for pending leave applications",
    leaveTypes: ["EARNED", "CASUAL", "MEDICAL", "MATERNITY", "PATERNITY", "STUDY", "SPECIAL", "SPECIAL_DISABILITY", "QUARANTINE", "EXTRAWITHPAY", "EXTRAWITHOUTPAY"],
    priority: 95,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, currentBalance, previousLeaves } = context;
      const { type, workingDays = 0 } = leaveRequest;

      if (!currentBalance) {
        return {
          passed: true,
          severity: "INFO",
          code: "BAL_NOT_AVAILABLE",
          message: "Balance information not available",
        };
      }

      const requestedBalance = currentBalance[type];
      if (!requestedBalance) {
        return {
          passed: true,
          severity: "INFO",
          code: "BAL_TYPE_NOT_FOUND",
          message: `Balance for ${type} not found`,
        };
      }

      // Calculate pending days from previous leaves
      const pendingLeaves = previousLeaves.filter(leave =>
        leave.status === "PENDING" &&
        leave.type === type &&
        leave.id
      );
      const pendingDays = pendingLeaves.reduce((sum, leave) => sum + leave.workingDays, 0);

      if (pendingDays > 0) {
        const available = requestedBalance.closing - requestedBalance.used;
        const effectiveAvailable = available - pendingDays;

        if (workingDays > effectiveAvailable) {
          return {
            passed: false,
            severity: "ERROR",
            code: "BAL_PENDING_OVERLAP",
            message: `You have ${pendingDays} days pending approval. Effective available balance: ${effectiveAvailable} days. Cannot request ${workingDays} days.`,
            suggestions: [
              {
                type: "SPLIT_REQUEST",
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
          message: `Note: ${pendingDays} days are pending approval. Effective available: ${effectiveAvailable} days.`,
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
      const { currentBalance, previousLeaves, leaveRequest } = context;
      const { type } = leaveRequest;
      const requestedBalance = currentBalance?.[type];
      if (!requestedBalance) {
        return `Balance Calculation: Balance for ${type} not found.`;
      }
      const pendingLeaves = previousLeaves.filter(leave =>
        leave.status === "PENDING" &&
        leave.type === type
      );
      const pendingDays = pendingLeaves.reduce((sum, leave) => sum + leave.workingDays, 0);
      return `Balance Calculation: Pending leave applications (${pendingDays} days) are deducted from available balance to prevent over-booking. Wait for pending approvals before submitting new requests.`;
    },
  },
];
