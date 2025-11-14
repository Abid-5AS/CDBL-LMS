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

// ARIA attributes and semantic HTML
export {
  AriaAttributeBuilder,
  getSemanticElement,
  aria,
  associateLabel,
  associateDescription,
  liveRegion,
  errorAttributes,
  buttonAttributes,
  linkAttributes,
  getHeadingElement,
  landmarkAttributes,
  tabAttributes,
  tabPanelAttributes,
  optionAttributes,
  validateAriaAttributes,
  getRecommendedRoles,
  type AriaRole,
  type AriaPoliteness,
  type Landmark,
} from "./aria";

// Screen reader support
export {
  screenReaderOnlyStyles,
  getScreenReaderOnlyClass,
  createScreenReaderText,
  ScreenReaderAnnouncer,
  getGlobalAnnouncer,
  announce,
  tableHeaderAttributes,
  tableCaption,
  listItemAttributes,
  createSkipLink,
  isHiddenFromScreenReaders,
  announceRegion,
  expandableAttributes,
  createPageStructure,
  getScreenReaderStyles,
  type AnnouncementOptions,
} from "./screenReader";
