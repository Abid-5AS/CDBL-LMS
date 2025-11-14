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

// Keyboard accessibility
export {
  KeyboardEventHandler,
  FocusTrap,
  setFocus,
  getFocusedElement,
  hasFocus,
  getFocusableElements,
  focusNext,
  focusPrevious,
  restoreFocus,
  type KeyboardHandler,
  type KeyboardEventMap,
  type FocusTrapOptions,
} from "./keyboard";
