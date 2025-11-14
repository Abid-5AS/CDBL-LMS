/**
 * Leave Request Validation Service
 * Centralizes all validation logic for leave requests
 */

import { LeaveType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  policy,
  daysInclusive,
  checkLeaveEligibility,
  calculateMaternityLeaveDays,
  validateQuarantineLeaveDuration,
  validateSpecialDisabilityDuration,
  validateExtraordinaryLeaveDuration,
  validateStudyLeaveDuration,
  validateStudyLeaveRetirement,
} from "@/lib/policy";
import { countWorkingDays } from "@/lib/working-days";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import {
  violatesCasualLeaveCombination,
  validatePaternityLeaveEligibility,
} from "@/lib/leave-validation";

export type ValidationResult = {
  valid: boolean;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  warning?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};

export class LeaveValidator {
  /**
   * Validate date range
   */
  static validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        valid: false,
        error: {
          code: "invalid_dates",
          message: "Invalid date format provided",
        },
      };
    }

    if (startDate > endDate) {
      return {
        valid: false,
        error: {
          code: "invalid_date_range",
          message: "Start date must be before end date",
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate service eligibility
   */
  static async validateEligibility(
    leaveType: LeaveType,
    joinDate: Date,
    retirementDate?: Date | null
  ): Promise<ValidationResult> {
    const eligibilityCheck = checkLeaveEligibility(leaveType, joinDate);

    if (!eligibilityCheck.eligible) {
      return {
        valid: false,
        error: {
          code: "service_eligibility_not_met",
          message: eligibilityCheck.reason || "Service eligibility not met",
          details: {
            leaveType,
            requiredYears: eligibilityCheck.requiredYears,
          },
        },
      };
    }

    // Check retirement date for study leave
    if (leaveType === "STUDY" && retirementDate) {
      const retirementCheck = validateStudyLeaveRetirement(retirementDate);
      if (!retirementCheck.valid) {
        return {
          valid: false,
          error: {
            code: "study_leave_retirement_restriction",
            message: retirementCheck.reason || "Study leave not allowed near retirement",
          },
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate earned leave advance notice
   */
  static async validateEarnedLeaveNotice(
    startDate: Date
  ): Promise<ValidationResult> {
    const today = normalizeToDhakaMidnight(new Date());
    const startDateOnly = normalizeToDhakaMidnight(startDate);
    const workingDaysNotice = await countWorkingDays(today, startDateOnly);

    if (workingDaysNotice < policy.elMinNoticeDays) {
      return {
        valid: false,
        error: {
          code: "el_insufficient_notice",
          message: `Earned leave requires ${policy.elMinNoticeDays} working days advance notice`,
          details: {
            required: policy.elMinNoticeDays,
            provided: workingDaysNotice,
          },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate casual leave constraints
   * Note: CL >3 days is ALLOWED per Policy 6.20(d,e) - will auto-convert to EL during approval
   */
  static async validateCasualLeave(
    userId: number,
    startDate: Date,
    endDate: Date,
    workingDays: number
  ): Promise<ValidationResult> {
    // CL >3 days: Allow but add warning (will auto-convert to EL per Policy 6.20.d/e)
    const clConversionWarning =
      workingDays > policy.clMaxConsecutiveDays
        ? {
            code: "cl_will_convert_to_el",
            message: `Casual leave exceeding ${policy.clMaxConsecutiveDays} days will be automatically converted to Earned Leave per Policy 6.20(e). Your entire leave period (${workingDays} days) will be deducted from your Earned Leave balance.`,
            details: {
              max: policy.clMaxConsecutiveDays,
              requested: workingDays,
              willConvertToEL: true,
            },
          }
        : undefined;

    // Check combination rule
    const startDateOnly = normalizeToDhakaMidnight(startDate);
    const endDateOnly = normalizeToDhakaMidnight(endDate);

    const combinationCheck = await violatesCasualLeaveCombination(
      userId,
      startDateOnly,
      endDateOnly
    );

    if (combinationCheck.violates && combinationCheck.conflictingLeave) {
      const conflict = combinationCheck.conflictingLeave;
      return {
        valid: false,
        error: {
          code: "cl_cannot_combine_with_other_leave",
          message: `Casual leave cannot be combined with or adjacent to other leaves. Conflicts with ${conflict.type} leave.`,
          details: {
            conflictingLeaveId: conflict.id,
            conflictingLeaveType: conflict.type,
            conflictingStartDate: conflict.startDate,
            conflictingEndDate: conflict.endDate,
          },
        },
      };
    }

    return {
      valid: true,
      ...(clConversionWarning && { warning: clConversionWarning }),
    };
  }

  /**
   * Validate maternity leave entitlement
   */
  static validateMaternityLeave(
    joinDate: Date,
    workingDays: number
  ): ValidationResult {
    const maternityCalc = calculateMaternityLeaveDays(joinDate);

    if (workingDays > maternityCalc.days) {
      const explanation = maternityCalc.isProrated
        ? `Prorated to ${maternityCalc.days} days based on ${maternityCalc.serviceMonths.toFixed(1)} months of service`
        : `Maximum 56 days (8 weeks) per policy`;

      return {
        valid: false,
        error: {
          code: "maternity_exceeds_entitlement",
          message: explanation,
          details: {
            maxDays: maternityCalc.days,
            requested: workingDays,
            isProrated: maternityCalc.isProrated,
            serviceMonths: maternityCalc.serviceMonths,
          },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate paternity leave eligibility
   */
  static async validatePaternityLeave(
    userId: number,
    startDate: Date
  ): Promise<ValidationResult> {
    const startDateOnly = normalizeToDhakaMidnight(startDate);
    const paternityCheck = await validatePaternityLeaveEligibility(
      userId,
      startDateOnly
    );

    if (!paternityCheck.valid) {
      return {
        valid: false,
        error: {
          code: "paternity_eligibility_not_met",
          message: paternityCheck.reason || "Paternity leave eligibility not met",
          details: {
            previousLeaves: paternityCheck.previousLeaves,
            monthsSinceFirst: paternityCheck.monthsSinceFirst,
          },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate quarantine leave duration
   */
  static validateQuarantineLeave(workingDays: number): ValidationResult {
    const quarantineCheck = validateQuarantineLeaveDuration(workingDays);

    if (!quarantineCheck.valid) {
      return {
        valid: false,
        error: {
          code: "quarantine_exceeds_maximum",
          message: quarantineCheck.reason || "Quarantine leave duration exceeds maximum",
          details: {
            requested: workingDays,
            maximum: 30,
          },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate special disability leave duration
   */
  static validateDisabilityLeave(workingDays: number): ValidationResult {
    const disabilityCheck = validateSpecialDisabilityDuration(workingDays);

    if (!disabilityCheck.valid) {
      return {
        valid: false,
        error: {
          code: "disability_exceeds_maximum",
          message: disabilityCheck.reason || "Disability leave duration exceeds maximum",
          details: {
            requested: workingDays,
            maximum: 180,
          },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate extraordinary leave duration
   */
  static validateExtraordinaryLeave(
    workingDays: number,
    joinDate: Date
  ): ValidationResult {
    const extraordinaryCheck = validateExtraordinaryLeaveDuration(
      workingDays,
      joinDate
    );

    if (!extraordinaryCheck.valid) {
      return {
        valid: false,
        error: {
          code: "extraordinary_exceeds_maximum",
          message: extraordinaryCheck.reason || "Extraordinary leave duration exceeds maximum",
          details: {
            requested: workingDays,
            maxAllowed: extraordinaryCheck.maxAllowed,
          },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate study leave duration
   */
  static async validateStudyLeave(
    userId: number,
    workingDays: number
  ): Promise<ValidationResult> {
    // Get previous study leaves
    const previousStudyLeaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: userId,
        type: "STUDY",
        status: "APPROVED",
      },
      orderBy: { endDate: "desc" },
    });

    const previousTotalDays = previousStudyLeaves.reduce(
      (sum, leave) => sum + leave.workingDays,
      0
    );

    const studyCheck = validateStudyLeaveDuration(workingDays, previousTotalDays);

    if (!studyCheck.valid) {
      return {
        valid: false,
        error: {
          code: "study_leave_duration_exceeded",
          message: studyCheck.reason || "Study leave duration exceeded",
          details: {
            requested: workingDays,
            previousDays: previousTotalDays,
            totalDays: studyCheck.totalDays,
            isExtension: studyCheck.isExtension,
            requiresBoardApproval: studyCheck.requiresBoardApproval,
          },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File): ValidationResult {
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const allowed = ["pdf", "jpg", "jpeg", "png"];

    if (!allowed.includes(ext)) {
      return {
        valid: false,
        error: {
          code: "unsupported_file_type",
          message: `File type .${ext} is not supported. Allowed: ${allowed.join(", ")}`,
        },
      };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: {
          code: "file_too_large",
          message: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
          details: {
            size: file.size,
            maxSize,
          },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Main validation orchestrator - validates entire leave request
   */
  static async validateLeaveRequest(data: {
    userId: number;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    joinDate: Date;
    retirementDate?: Date | null;
    certificateFile?: File;
  }): Promise<ValidationResult> {
    const {
      userId,
      type,
      startDate,
      endDate,
      workingDays,
      joinDate,
      retirementDate,
      certificateFile,
    } = data;

    // 1. Validate date range
    const dateResult = this.validateDateRange(startDate, endDate);
    if (!dateResult.valid) return dateResult;

    // 2. Validate eligibility
    const eligibilityResult = await this.validateEligibility(
      type,
      joinDate,
      retirementDate
    );
    if (!eligibilityResult.valid) return eligibilityResult;

    // 3. Validate file if provided
    if (certificateFile) {
      const fileResult = this.validateFileUpload(certificateFile);
      if (!fileResult.valid) return fileResult;
    }

    // 4. Type-specific validations
    switch (type) {
      case "EARNED":
        return await this.validateEarnedLeaveNotice(startDate);

      case "CASUAL":
        return await this.validateCasualLeave(
          userId,
          startDate,
          endDate,
          workingDays
        );

      case "MATERNITY":
        return this.validateMaternityLeave(joinDate, workingDays);

      case "PATERNITY":
        return await this.validatePaternityLeave(userId, startDate);

      case "QUARANTINE":
        return this.validateQuarantineLeave(workingDays);

      case "SPECIAL_DISABILITY":
        return this.validateDisabilityLeave(workingDays);

      case "EXTRAWITHPAY":
      case "EXTRAWITHOUTPAY":
        return this.validateExtraordinaryLeave(workingDays, joinDate);

      case "STUDY":
        return await this.validateStudyLeave(userId, workingDays);

      default:
        return { valid: true };
    }
  }
}
