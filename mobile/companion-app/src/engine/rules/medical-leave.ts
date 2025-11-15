import type { Rule, ValidationContext, RuleResult } from "../../types";
import { differenceInDays } from "date-fns";

/**
 * Medical Leave Rules
 *
 * - Medical certificate required for 3+ consecutive days
 * - Can be backdated (up to 7 days)
 * - No advance notice required
 * - Can start/end on any day (weekends/holidays allowed)
 */

export const medicalLeaveRules: Rule[] = [
  {
    id: "ML_001",
    name: "Medical Certificate Requirement",
    description: "Medical certificate required for 3+ consecutive days",
    leaveTypes: ["MEDICAL", "Medical Leave"],
    priority: 100,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest } = context;
      const { workingDays = 0, attachments = [] } = leaveRequest;

      if (workingDays >= 3) {
        const hasMedicalCertificate = attachments.some(
          (att) =>
            att.type === "MEDICAL_CERTIFICATE" || att.type === "medical_certificate"
        );

        if (!hasMedicalCertificate) {
          return {
            passed: false,
            severity: "ERROR",
            code: "ML_CERTIFICATE_REQUIRED",
            message: `Medical certificate is required for medical leave of 3 or more days. You requested ${workingDays} days.`,
            suggestions: [
              {
                type: "ADD_ATTACHMENT",
                reasoning:
                  "Upload a medical certificate from a registered medical practitioner. The certificate should specify the recommended rest period.",
                priority: 100,
              },
              {
                type: "SPLIT_REQUEST",
                reasoning:
                  "If you don't have a medical certificate yet, you can split into multiple requests of 2 days or less until you get the certificate.",
                priority: 60,
              },
            ],
          };
        }
      }

      return {
        passed: true,
        severity: "INFO",
        code: "ML_CERTIFICATE_OK",
        message:
          workingDays >= 3
            ? "Medical certificate requirement met"
            : "Medical certificate not required for this duration",
      };
    },
    explain: (context: ValidationContext): string => {
      const { workingDays = 0 } = context.leaveRequest;
      return `Medical Leave Policy: Medical certificate from a registered practitioner is required for 3 or more consecutive days. Your request: ${workingDays} days. This ensures medical leave is used appropriately.`;
    },
  },

  {
    id: "ML_002",
    name: "Medical Leave Max Days Warning",
    description: "Warning for medical leave exceeding 10 days",
    leaveTypes: ["MEDICAL", "Medical Leave"],
    priority: 80,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest } = context;
      const { workingDays = 0 } = leaveRequest;

      if (workingDays > 10) {
        return {
          passed: true,
          severity: "WARNING",
          code: "ML_EXTENDED_DURATION",
          message: `You're requesting ${workingDays} days of medical leave. Extended medical leaves may require HR review and fitness certificate before return to work.`,
          suggestions: [
            {
              type: "CONTACT_HR",
              reasoning:
                "For extended medical leaves (10+ days), please contact HR to discuss any required documentation or return-to-work procedures.",
              priority: 70,
            },
          ],
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "ML_DURATION_OK",
        message: "Medical leave duration is within normal range",
      };
    },
    explain: (context: ValidationContext): string => {
      const { workingDays = 0 } = context.leaveRequest;
      return `Medical Leave Policy: Extended medical leaves (${workingDays} days) may require additional HR review. A fitness certificate may be required before returning to work.`;
    },
  },

  {
    id: "ML_003",
    name: "Medical Leave Backdating Validation",
    description: "Medical leave can be backdated up to 7 days",
    leaveTypes: ["MEDICAL", "Medical Leave"],
    priority: 90,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, currentDate } = context;
      const { startDate } = leaveRequest;

      if (!startDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "ML_START_DATE_NOT_SET",
          message: "Start date not set yet",
        };
      }

      const daysBack = differenceInDays(currentDate, startDate);

      if (daysBack > 7) {
        return {
          passed: false,
          severity: "ERROR",
          code: "ML_BACKDATE_LIMIT_EXCEEDED",
          message: `Medical Leave can only be backdated up to 7 days. You're trying to backdate ${daysBack} days. Please contact HR for special approval.`,
          suggestions: [
            {
              type: "CONTACT_HR",
              reasoning:
                "For backdating beyond 7 days, you'll need special approval from HR. Contact them with your medical certificate and explanation.",
              priority: 90,
            },
          ],
        };
      }

      if (daysBack > 0) {
        return {
          passed: true,
          severity: "WARNING",
          code: "ML_BACKDATED",
          message: `This medical leave is backdated by ${daysBack} days. Ensure you have valid medical documentation for the entire period.`,
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "ML_DATE_OK",
        message: "Medical leave dates are valid",
      };
    },
    explain: (context: ValidationContext): string => {
      const { startDate } = context.leaveRequest;
      const daysBack = startDate
        ? differenceInDays(context.currentDate, startDate)
        : 0;
      return `Medical Leave Policy: Can be backdated up to 7 days to accommodate emergency medical situations. Your request is backdated ${daysBack} days. Medical certificate must cover the entire period.`;
    },
  },

  {
    id: "ML_004",
    name: "Medical Leave Same-Day Approval",
    description: "Medical leave can be applied same day",
    leaveTypes: ["MEDICAL", "Medical Leave"],
    priority: 70,
    validate: (context: ValidationContext): RuleResult => {
      const { leaveRequest, currentDate } = context;
      const { startDate } = leaveRequest;

      if (!startDate) {
        return {
          passed: true,
          severity: "INFO",
          code: "ML_START_DATE_NOT_SET",
          message: "Start date not set yet",
        };
      }

      const daysInAdvance = differenceInDays(startDate, currentDate);

      if (daysInAdvance === 0) {
        return {
          passed: true,
          severity: "INFO",
          code: "ML_SAME_DAY",
          message:
            "Medical leave applied for today. Please inform your supervisor as soon as possible and submit medical certificate within 3 days.",
        };
      }

      return {
        passed: true,
        severity: "INFO",
        code: "ML_ADVANCE_APPLICATION",
        message: "Medical leave applied in advance",
      };
    },
    explain: (context: ValidationContext): string => {
      return "Medical Leave Policy: No advance notice required. Can be applied same-day or backdated. Always inform your supervisor as soon as possible via call/message.";
    },
  },
];
