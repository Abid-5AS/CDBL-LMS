/**
 * Accessibility Audit
 *
 * Utilities for auditing accessibility issues
 */

/**
 * Accessibility issue severity
 */
export type IssueSeverity = "error" | "warning" | "notice";

/**
 * WCAG conformance level
 */
export type WCAGLevel = "A" | "AA" | "AAA";

/**
 * Accessibility issue
 */
export interface AccessibilityIssue {
  id: string;
  type: string;
  severity: IssueSeverity;
  element: Element;
  elementPath: string;
  message: string;
  wcagLevel: WCAGLevel;
  wcagCriteria: string;
  suggestion: string;
  affectsUsers: string;
}

/**
 * Audit result
 */
export interface AccessibilityAuditResult {
  timestamp: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  notices: number;
  scorePercentage: number;
  issues: AccessibilityIssue[];
  summary: {
    wcagACompliance: boolean;
    wcagAACompliance: boolean;
    wcagAAACompliance: boolean;
  };
}

/**
 * Accessibility auditor
 */
export class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];

  /**
   * Run full accessibility audit
   */
  audit(): AccessibilityAuditResult {
    this.issues = [];

    // Run all checks
    this.checkAriaLabels();
    this.checkHeadingHierarchy();
    this.checkImageAltText();
    this.checkFormLabels();
    this.checkLinkText();
    this.checkKeyboardAccessibility();
    this.checkFocusManagement();
    this.checkAriaRoles();
    this.checkSemanticHTML();
    this.checkLanguageAttribute();

    return this.generateReport();
  }

  /**
   * Check for proper ARIA labels
   */
  private checkAriaLabels(): void {
    const buttons = document.querySelectorAll("button, [role='button']");

    buttons.forEach((button) => {
      if (this.hasNoAccessibleLabel(button)) {
        this.addIssue({
          type: "missing-aria-label",
          severity: "error",
          element: button,
          message: "Button missing accessible label",
          wcagLevel: "A",
          wcagCriteria: "4.1.2 Name, Role, Value",
          suggestion: "Add aria-label, aria-labelledby, or visible text to button",
          affectsUsers: "Screen reader and speech control users",
        });
      }
    });
  }

  /**
   * Check heading hierarchy
   */
  private checkHeadingHierarchy(): void {
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let previousLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]);

      if (previousLevel > 0 && level > previousLevel + 1) {
        this.addIssue({
          type: "heading-hierarchy-skipped",
          severity: "warning",
          element: heading,
          message: `Heading level jumped from H${previousLevel} to H${level}`,
          wcagLevel: "A",
          wcagCriteria: "1.3.1 Info and Relationships",
          suggestion: `Use sequential heading levels (skip no more than 1 level)`,
          affectsUsers: "Screen reader users",
        });
      }

      previousLevel = level;
    });

    // Check for missing H1
    const h1s = document.querySelectorAll("h1");
    if (h1s.length === 0) {
      this.addIssue({
        type: "missing-h1",
        severity: "error",
        element: document.body,
        message: "Page missing H1 heading",
        wcagLevel: "A",
        wcagCriteria: "1.3.1 Info and Relationships",
        suggestion: "Add exactly one H1 heading per page",
        affectsUsers: "Screen reader users",
      });
    }

    if (h1s.length > 1) {
      this.addIssue({
        type: "multiple-h1",
        severity: "warning",
        element: h1s[1],
        message: "Page has multiple H1 headings",
        wcagLevel: "A",
        wcagCriteria: "1.3.1 Info and Relationships",
        suggestion: "Use only one H1 per page",
        affectsUsers: "Screen reader users",
      });
    }
  }

  /**
   * Check image alt text
   */
  private checkImageAltText(): void {
    const images = document.querySelectorAll("img");

    images.forEach((img) => {
      if (!img.hasAttribute("alt")) {
        this.addIssue({
          type: "missing-alt-text",
          severity: "error",
          element: img,
          message: "Image missing alt attribute",
          wcagLevel: "A",
          wcagCriteria: "1.1.1 Non-text Content",
          suggestion: "Add descriptive alt text to image",
          affectsUsers: "Screen reader and vision-impaired users",
        });
      } else if (img.getAttribute("alt")?.trim() === "") {
        this.addIssue({
          type: "empty-alt-text",
          severity: "warning",
          element: img,
          message: "Image has empty alt attribute",
          wcagLevel: "A",
          wcagCriteria: "1.1.1 Non-text Content",
          suggestion: "Either provide meaningful alt text or use alt='' for decorative images",
          affectsUsers: "Screen reader users",
        });
      }
    });
  }

  /**
   * Check form labels
   */
  private checkFormLabels(): void {
    const inputs = document.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      const id = input.getAttribute("id");
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledby = input.getAttribute("aria-labelledby");

      // Check for associated label
      let hasLabel = false;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        hasLabel = !!label;
      }

      if (!hasLabel && !ariaLabel && !ariaLabelledby) {
        this.addIssue({
          type: "missing-form-label",
          severity: "error",
          element: input,
          message: "Form input missing accessible label",
          wcagLevel: "A",
          wcagCriteria: "4.1.2 Name, Role, Value",
          suggestion: "Associate label with input via 'for' attribute or use aria-label",
          affectsUsers: "Screen reader and speech control users",
        });
      }
    });
  }

  /**
   * Check link text
   */
  private checkLinkText(): void {
    const links = document.querySelectorAll("a");

    links.forEach((link) => {
      const text = link.textContent?.trim() || "";
      const ariaLabel = link.getAttribute("aria-label");

      if (!text && !ariaLabel) {
        this.addIssue({
          type: "empty-link-text",
          severity: "error",
          element: link,
          message: "Link missing accessible text",
          wcagLevel: "A",
          wcagCriteria: "4.1.2 Name, Role, Value",
          suggestion: "Add visible text to link or use aria-label",
          affectsUsers: "Screen reader and speech control users",
        });
      } else if (text.toLowerCase() === "click here" || text.toLowerCase() === "read more") {
        this.addIssue({
          type: "non-descriptive-link-text",
          severity: "warning",
          element: link,
          message: "Link text is not descriptive",
          wcagLevel: "A",
          wcagCriteria: "2.4.4 Link Purpose (In Context)",
          suggestion: `Use descriptive link text instead of "${text}"`,
          affectsUsers: "All users, especially screen reader users",
        });
      }
    });
  }

  /**
   * Check keyboard accessibility
   */
  private checkKeyboardAccessibility(): void {
    const interactiveElements = document.querySelectorAll(
      "button, a, input, textarea, select, [role='button'], [role='link']"
    );

    interactiveElements.forEach((element) => {
      if (element.tagName === "DIV" || element.getAttribute("role") === "button") {
        if (!element.hasAttribute("tabindex")) {
          this.addIssue({
            type: "non-semantic-interactive",
            severity: "error",
            element: element,
            message: "Interactive element not keyboard accessible",
            wcagLevel: "A",
            wcagCriteria: "2.1.1 Keyboard",
            suggestion: "Use semantic HTML (button, a) or add tabindex",
            affectsUsers: "Keyboard and screen reader users",
          });
        }
      }
    });
  }

  /**
   * Check focus management
   */
  private checkFocusManagement(): void {
    // Check for focus outline CSS
    const style = document.querySelector("style");
    if (style) {
      const cssText = style.textContent || "";
      if (cssText.includes("outline: none") || cssText.includes("outline: 0")) {
        this.addIssue({
          type: "focus-outline-hidden",
          severity: "error",
          element: style,
          message: "Focus outline hidden with CSS",
          wcagLevel: "A",
          wcagCriteria: "2.4.7 Focus Visible",
          suggestion: "Keep default focus outline or provide visible alternative",
          affectsUsers: "Keyboard navigation users",
        });
      }
    }
  }

  /**
   * Check ARIA roles
   */
  private checkAriaRoles(): void {
    const ariaElements = document.querySelectorAll("[role]");

    ariaElements.forEach((element) => {
      const role = element.getAttribute("role");
      const validRoles = [
        "button",
        "link",
        "menuitem",
        "tab",
        "alert",
        "article",
        "banner",
        "complementary",
        "contentinfo",
        "form",
        "main",
        "navigation",
        "region",
        "search",
      ];

      if (role && !validRoles.includes(role)) {
        this.addIssue({
          type: "invalid-aria-role",
          severity: "warning",
          element: element,
          message: `Invalid ARIA role: "${role}"`,
          wcagLevel: "A",
          wcagCriteria: "4.1.2 Name, Role, Value",
          suggestion: "Use valid ARIA role or remove role attribute",
          affectsUsers: "Screen reader users",
        });
      }
    });
  }

  /**
   * Check semantic HTML usage
   */
  private checkSemanticHTML(): void {
    // Check for divs used as buttons
    const divButtons = document.querySelectorAll("div[role='button']");
    if (divButtons.length > 0) {
      divButtons.forEach((element) => {
        this.addIssue({
          type: "non-semantic-button",
          severity: "notice",
          element: element,
          message: "Using div with role='button' instead of semantic button element",
          wcagLevel: "A",
          wcagCriteria: "1.3.1 Info and Relationships",
          suggestion: "Use semantic <button> element instead",
          affectsUsers: "All users",
        });
      });
    }

    // Check for nav elements
    const navElements = document.querySelectorAll("nav");
    if (navElements.length === 0) {
      const hasNavigation = document.querySelector("[role='navigation']");
      if (!hasNavigation) {
        this.addIssue({
          type: "missing-nav-landmark",
          severity: "notice",
          element: document.body,
          message: "No navigation landmark found",
          wcagLevel: "A",
          wcagCriteria: "1.3.1 Info and Relationships",
          suggestion: "Use <nav> element or [role='navigation'] for navigation areas",
          affectsUsers: "Screen reader users",
        });
      }
    }
  }

  /**
   * Check language attribute
   */
  private checkLanguageAttribute(): void {
    const html = document.documentElement;
    if (!html.hasAttribute("lang")) {
      this.addIssue({
        type: "missing-lang-attribute",
        severity: "error",
        element: html,
        message: "HTML element missing lang attribute",
        wcagLevel: "A",
        wcagCriteria: "3.1.1 Language of Page",
        suggestion: "Add lang attribute to html element (e.g., lang='en')",
        affectsUsers: "Screen reader users",
      });
    }
  }

  /**
   * Add issue to list
   */
  private addIssue(data: Omit<AccessibilityIssue, "id" | "elementPath">): void {
    const issue: AccessibilityIssue = {
      id: `issue-${this.issues.length}`,
      ...data,
      elementPath: this.getElementPath(data.element),
    };

    this.issues.push(issue);
  }

  /**
   * Get element path for debugging
   */
  private getElementPath(element: Element): string {
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${(current.className as string).split(" ").join(".")}`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  /**
   * Check if element has no accessible label
   */
  private hasNoAccessibleLabel(element: Element): boolean {
    // Check for text content
    if (element.textContent?.trim()) {
      return false;
    }

    // Check for aria-label
    if (element.hasAttribute("aria-label")) {
      return false;
    }

    // Check for aria-labelledby
    if (element.hasAttribute("aria-labelledby")) {
      return false;
    }

    // Check for title attribute (fallback)
    if (element.hasAttribute("title")) {
      return false;
    }

    return true;
  }

  /**
   * Generate audit report
   */
  private generateReport(): AccessibilityAuditResult {
    const errors = this.issues.filter((i) => i.severity === "error").length;
    const warnings = this.issues.filter((i) => i.severity === "warning").length;
    const notices = this.issues.filter((i) => i.severity === "notice").length;

    // Score calculation: perfect score 100, deducted points for issues
    let score = 100;
    score -= errors * 10;
    score -= warnings * 3;
    score -= notices * 1;
    score = Math.max(0, Math.min(100, score));

    return {
      timestamp: Date.now(),
      totalIssues: this.issues.length,
      errors,
      warnings,
      notices,
      scorePercentage: score,
      issues: this.issues,
      summary: {
        wcagACompliance: errors === 0,
        wcagAACompliance: errors === 0 && warnings === 0,
        wcagAAACompliance:
          errors === 0 && warnings === 0 && notices === 0,
      },
    };
  }
}

/**
 * Run accessibility audit
 */
export function runAccessibilityAudit(): AccessibilityAuditResult {
  const auditor = new AccessibilityAuditor();
  return auditor.audit();
}

/**
 * Get audit summary string
 */
export function getAuditSummary(result: AccessibilityAuditResult): string {
  let summary = `Accessibility Audit Report\n`;
  summary += `==========================\n\n`;

  summary += `Score: ${result.scorePercentage.toFixed(0)}%\n`;
  summary += `Total Issues: ${result.totalIssues}\n`;
  summary += `  Errors: ${result.errors}\n`;
  summary += `  Warnings: ${result.warnings}\n`;
  summary += `  Notices: ${result.notices}\n\n`;

  summary += `WCAG Compliance:\n`;
  summary += `  WCAG A: ${result.summary.wcagACompliance ? "✅" : "❌"}\n`;
  summary += `  WCAG AA: ${result.summary.wcagAACompliance ? "✅" : "❌"}\n`;
  summary += `  WCAG AAA: ${result.summary.wcagAAACompliance ? "✅" : "❌"}\n`;

  return summary;
}

/**
 * Export audit as JSON
 */
export function exportAuditAsJSON(result: AccessibilityAuditResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Export audit as HTML report
 */
export function exportAuditAsHTML(result: AccessibilityAuditResult): string {
  let html = `<html><head><title>Accessibility Audit Report</title>`;
  html += `<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .error { color: #d32f2f; font-weight: bold; }
    .warning { color: #f57c00; font-weight: bold; }
    .notice { color: #0288d1; }
    .issue { margin: 15px 0; padding: 10px; border-left: 4px solid #ccc; }
    .issue.error { border-color: #d32f2f; background: #ffebee; }
    .issue.warning { border-color: #f57c00; background: #fff3e0; }
    .issue.notice { border-color: #0288d1; background: #e3f2fd; }
    .score { font-size: 32px; font-weight: bold; }
  </style></head><body>`;

  html += `<h1>Accessibility Audit Report</h1>`;
  html += `<p class="score">${result.scorePercentage.toFixed(0)}%</p>`;
  html += `<p>Total Issues: ${result.totalIssues}</p>`;

  result.issues.forEach((issue) => {
    html += `<div class="issue ${issue.severity}">`;
    html += `<strong class="${issue.severity}">${issue.severity.toUpperCase()}:</strong> `;
    html += `<span>${issue.message}</span><br>`;
    html += `<small>WCAG ${issue.wcagLevel} - ${issue.wcagCriteria}</small><br>`;
    html += `<small>Suggestion: ${issue.suggestion}</small>`;
    html += `</div>`;
  });

  html += `</body></html>`;
  return html;
}
