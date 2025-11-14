/**
 * Accessibility Library
 *
 * Export all accessibility utilities
 */

// Audit utilities
export {
  AccessibilityAuditor,
  runAccessibilityAudit,
  getAuditSummary,
  exportAuditAsJSON,
  exportAuditAsHTML,
  type AccessibilityIssue,
  type AccessibilityAuditResult,
  type IssueSeverity,
  type WCAGLevel,
} from "./audit";

// WCAG compliance
export {
  WCAGComplianceChecker,
  checkWCAGAA,
  getWCAGSummary,
  type WCAGCriterionResult,
  type WCAGComplianceReport,
} from "./wcag";
