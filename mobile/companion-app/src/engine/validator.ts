import type {
  ValidationContext,
  ValidationResult,
  Violation,
  Warning,
  Suggestion,
  Rule,
  RuleResult,
} from "../types";
import { casualLeaveRules } from "./rules/casual-leave";
import { earnedLeaveRules } from "./rules/earned-leave";
import { medicalLeaveRules } from "./rules/medical-leave";
import { balanceRules } from "./rules/balance";
import { dateRules } from "./rules/date-validation";

/**
 * Offline Rule Engine
 *
 * Validates leave requests against company policies entirely offline.
 * No server connection required.
 */
export class LeaveValidator {
  private rules: Rule[];

  constructor() {
    // Load all rules
    this.rules = [
      ...casualLeaveRules,
      ...earnedLeaveRules,
      ...medicalLeaveRules,
      ...balanceRules,
      ...dateRules,
    ].sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  /**
   * Validate a leave request against all applicable rules
   */
  validate(context: ValidationContext): ValidationResult {
    const violations: Violation[] = [];
    const warnings: Warning[] = [];
    const suggestions: Suggestion[] = [];

    const { leaveRequest } = context;
    const leaveType = leaveRequest.type;

    if (!leaveType) {
      return {
        isValid: false,
        violations: [
          {
            code: "LEAVE_TYPE_REQUIRED",
            message: "Leave type is required",
            severity: "ERROR",
            ruleId: "CORE_001",
          },
        ],
        warnings: [],
        suggestions: [],
      };
    }

    // Get rules applicable to this leave type
    const applicableRules = this.rules.filter(
      (rule) =>
        rule.leaveTypes.includes(leaveType) ||
        rule.leaveTypes.includes("ALL" as any)
    );

    // Execute rules
    for (const rule of applicableRules) {
      try {
        const result = rule.validate(context);

        if (!result.passed) {
          if (result.severity === "ERROR") {
            violations.push({
              code: result.code,
              message: result.message,
              severity: result.severity,
              ruleId: rule.id,
            });
          } else if (result.severity === "WARNING") {
            warnings.push({
              code: result.code,
              message: result.message,
              suggestion: result.suggestions?.[0]?.reasoning,
            });
          }

          // Collect suggestions
          if (result.suggestions) {
            suggestions.push(...result.suggestions);
          }
        }
      } catch (error) {
        console.error(`Rule ${rule.id} failed:`, error);
      }
    }

    // Sort suggestions by priority
    suggestions.sort((a, b) => b.priority - a.priority);

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      suggestions: suggestions.slice(0, 5), // Top 5 suggestions
    };
  }

  /**
   * Get explanation for why a leave request is invalid
   */
  explain(context: ValidationContext): string[] {
    const explanations: string[] = [];
    const { leaveRequest } = context;
    const leaveType = leaveRequest.type;

    if (!leaveType) {
      return ["Leave type is required"];
    }

    const applicableRules = this.rules.filter(
      (rule) =>
        rule.leaveTypes.includes(leaveType) ||
        rule.leaveTypes.includes("ALL" as any)
    );

    for (const rule of applicableRules) {
      try {
        const result = rule.validate(context);
        if (!result.passed) {
          const explanation = rule.explain(context);
          if (explanation) {
            explanations.push(explanation);
          }
        }
      } catch (error) {
        console.error(`Rule ${rule.id} explanation failed:`, error);
      }
    }

    return explanations;
  }

  /**
   * Quick validation - returns boolean only
   */
  isValid(context: ValidationContext): boolean {
    const result = this.validate(context);
    return result.isValid;
  }

  /**
   * Get all violations
   */
  getViolations(context: ValidationContext): Violation[] {
    const result = this.validate(context);
    return result.violations;
  }

  /**
   * Get all warnings
   */
  getWarnings(context: ValidationContext): Warning[] {
    const result = this.validate(context);
    return result.warnings;
  }

  /**
   * Get all suggestions
   */
  getSuggestions(context: ValidationContext): Suggestion[] {
    const result = this.validate(context);
    return result.suggestions;
  }
}

// Export singleton instance
export const leaveValidator = new LeaveValidator();
