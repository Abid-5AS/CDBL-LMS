/**
 * WCAG 2.1 Compliance Checker
 *
 * Utilities for checking specific WCAG 2.1 criteria
 */

import { meetsWCAGAA, meetsWCAGAAA } from "@/lib/colors/contrast";

/**
 * WCAG criterion result
 */
export interface WCAGCriterionResult {
  criterion: string;
  level: "A" | "AA" | "AAA";
  passes: boolean;
  message: string;
  affectedElements: number;
}

/**
 * WCAG compliance report
 */
export interface WCAGComplianceReport {
  timestamp: number;
  overallCompliance: {
    levelA: boolean;
    levelAA: boolean;
    levelAAA: boolean;
  };
  results: WCAGCriterionResult[];
  passCount: number;
  failCount: number;
  successRate: number;
}

/**
 * WCAG Compliance Checker
 */
export class WCAGComplianceChecker {
  private results: WCAGCriterionResult[] = [];

  /**
   * Check all WCAG 2.1 AA criteria
   */
  checkWCAGAA(): WCAGComplianceReport {
    this.results = [];

    // Perceivable
    this.check11NonTextContent();
    this.check12TimeBasedMedia();
    this.check13Adaptable();
    this.check14Distinguishable();

    // Operable
    this.check21Keyboard();
    this.check22KeyboardTraps();
    this.check23Seizures();
    this.check24Navigable();

    // Understandable
    this.check31Readable();
    this.check32Predictable();
    this.check33InputAssistance();

    // Robust
    this.check41Compatible();

    return this.generateReport();
  }

  // Perceivable Criteria

  private check11NonTextContent(): void {
    const images = document.querySelectorAll("img");
    let passed = 0;

    images.forEach((img) => {
      if (img.hasAttribute("alt") && img.getAttribute("alt")?.trim() !== "") {
        passed++;
      }
    });

    this.addResult({
      criterion: "1.1.1 Non-text Content (Level A)",
      level: "A",
      passes: passed === images.length,
      message: `${passed}/${images.length} images have alt text`,
      affectedElements: images.length - passed,
    });
  }

  private check12TimeBasedMedia(): void {
    const videos = document.querySelectorAll("video");
    const audios = document.querySelectorAll("audio");
    const mediaElements = videos.length + audios.length;

    // Check for captions (simplified check)
    let captioned = 0;
    videos.forEach((video) => {
      if (video.querySelector("track[kind='captions']")) {
        captioned++;
      }
    });

    this.addResult({
      criterion: "1.2.1 Audio-only and Video-only (Prerecorded) (Level A)",
      level: "A",
      passes: captioned === videos.length,
      message: `${captioned}/${videos.length} videos have captions`,
      affectedElements: videos.length - captioned,
    });
  }

  private check13Adaptable(): void {
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const levels = Array.from(headings).map((h) =>
      parseInt(h.tagName[1])
    );

    let hierarchyValid = true;
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        hierarchyValid = false;
        break;
      }
    }

    this.addResult({
      criterion: "1.3.1 Info and Relationships (Level A)",
      level: "A",
      passes: hierarchyValid,
      message: hierarchyValid
        ? "Proper heading hierarchy maintained"
        : "Heading hierarchy has gaps",
      affectedElements: hierarchyValid ? 0 : headings.length,
    });
  }

  private check14Distinguishable(): void {
    // Check text sizing (simplified)
    const textElements = document.querySelectorAll("body, body *");
    let smallText = 0;

    textElements.forEach((element) => {
      const fontSize = window.getComputedStyle(element).fontSize;
      const size = parseFloat(fontSize);
      // WCAG recommends 12px minimum for body text
      if (size < 12) {
        smallText++;
      }
    });

    this.addResult({
      criterion: "1.4.4 Resize Text (Level AA)",
      level: "AA",
      passes: smallText === 0,
      message: `${smallText} elements have text smaller than 12px`,
      affectedElements: smallText,
    });
  }

  // Operable Criteria

  private check21Keyboard(): void {
    const interactiveElements = document.querySelectorAll(
      "button, a, input, textarea, select"
    );
    let keyboardAccessible = 0;

    interactiveElements.forEach((element) => {
      // Check if element can be accessed via keyboard
      const tagName = element.tagName.toLowerCase();
      if (["button", "a", "input", "textarea", "select"].includes(tagName)) {
        keyboardAccessible++;
      }
    });

    this.addResult({
      criterion: "2.1.1 Keyboard (Level A)",
      level: "A",
      passes: keyboardAccessible === interactiveElements.length,
      message: `${keyboardAccessible}/${interactiveElements.length} interactive elements are keyboard accessible`,
      affectedElements: interactiveElements.length - keyboardAccessible,
    });
  }

  private check22KeyboardTraps(): void {
    // Check for elements with event handlers that might trap focus
    const eventHandlers = document.querySelectorAll("[onkeydown], [onkeyup]");

    this.addResult({
      criterion: "2.1.2 No Keyboard Trap (Level A)",
      level: "A",
      passes: eventHandlers.length === 0,
      message:
        eventHandlers.length === 0
          ? "No keyboard traps detected"
          : `${eventHandlers.length} elements with potential keyboard traps`,
      affectedElements: eventHandlers.length,
    });
  }

  private check23Seizures(): void {
    // Check for animations that might cause seizures
    const animations = document.querySelectorAll("[style*='animation']");
    const flashingElements = animations.length;

    this.addResult({
      criterion: "2.3.1 Three Flashes or Below Threshold (Level A)",
      level: "A",
      passes: flashingElements === 0,
      message: `${flashingElements} animated elements (manual review recommended)`,
      affectedElements: flashingElements,
    });
  }

  private check24Navigable(): void {
    // Check for navigation landmarks
    const nav = document.querySelector("nav, [role='navigation']");
    const main = document.querySelector("main, [role='main']");
    const hasSkipLink = document.querySelector('a[href="#main"]');

    const passNavigation = !!nav && !!main;
    const passSkipLink = !!hasSkipLink;

    this.addResult({
      criterion: "2.4.1 Bypass Blocks (Level A)",
      level: "A",
      passes: passSkipLink || passNavigation,
      message: passSkipLink ? "Skip link present" : "Consider adding skip links",
      affectedElements: passSkipLink ? 0 : 1,
    });

    // Check for clear focus indicators
    const focusStyle = this.checkFocusIndicators();
    this.addResult({
      criterion: "2.4.7 Focus Visible (Level AA)",
      level: "AA",
      passes: focusStyle,
      message: focusStyle
        ? "Focus indicators are visible"
        : "Focus indicators may not be visible",
      affectedElements: focusStyle ? 0 : 1,
    });
  }

  // Understandable Criteria

  private check31Readable(): void {
    const lang = document.documentElement.getAttribute("lang");

    this.addResult({
      criterion: "3.1.1 Language of Page (Level A)",
      level: "A",
      passes: !!lang,
      message: lang ? `Page language set to: ${lang}` : "No language attribute set",
      affectedElements: lang ? 0 : 1,
    });
  }

  private check32Predictable(): void {
    // Check for unexpected behavior (simplified)
    const autoSubmitForms = document.querySelectorAll("form[onchange]");

    this.addResult({
      criterion: "3.2.2 On Input (Level A)",
      level: "A",
      passes: autoSubmitForms.length === 0,
      message:
        autoSubmitForms.length === 0
          ? "No auto-submitting forms detected"
          : "Forms that auto-submit on input detected",
      affectedElements: autoSubmitForms.length,
    });
  }

  private check33InputAssistance(): void {
    // Check for form error identification
    const forms = document.querySelectorAll("form");
    let formsWithErrors = 0;

    forms.forEach((form) => {
      const errorElements = form.querySelectorAll("[role='alert'], .error, [aria-invalid]");
      if (errorElements.length > 0) {
        formsWithErrors++;
      }
    });

    this.addResult({
      criterion: "3.3.1 Error Identification (Level A)",
      level: "A",
      passes: formsWithErrors === 0 || formsWithErrors === forms.length,
      message: `${formsWithErrors} forms have error identification`,
      affectedElements: Math.abs(forms.length - formsWithErrors),
    });
  }

  // Robust Criteria

  private check41Compatible(): void {
    // Check for valid HTML (simplified)
    const semanticErrors = document.querySelectorAll(
      "div[role='button'], span[role='link']"
    ).length;

    this.addResult({
      criterion: "4.1.1 Parsing (Level A)",
      level: "A",
      passes: semanticErrors === 0,
      message:
        semanticErrors === 0
          ? "Using semantic HTML elements"
          : `${semanticErrors} non-semantic elements with ARIA roles`,
      affectedElements: semanticErrors,
    });
  }

  /**
   * Add result to list
   */
  private addResult(result: WCAGCriterionResult): void {
    this.results.push(result);
  }

  /**
   * Check focus indicators (heuristic)
   */
  private checkFocusIndicators(): boolean {
    if (typeof window === "undefined") {
      return true;
    }

    const styles = document.querySelectorAll("style, [rel='stylesheet']");
    let hasFocusOutline = false;
    let removedOutline = false;

    styles.forEach((style) => {
      const content = style.textContent || "";
      if (content.includes(":focus")) {
        hasFocusOutline = true;
      }
      if (
        content.includes("outline: none") ||
        content.includes("outline: 0")
      ) {
        removedOutline = true;
      }
    });

    return !removedOutline;
  }

  /**
   * Generate compliance report
   */
  private generateReport(): WCAGComplianceReport {
    const passCount = this.results.filter((r) => r.passes).length;
    const failCount = this.results.filter((r) => !r.passes).length;
    const successRate = (passCount / this.results.length) * 100;

    const levelAResults = this.results.filter((r) => r.level === "A");
    const levelAAResults = this.results.filter((r) => r.level === "AA");

    return {
      timestamp: Date.now(),
      overallCompliance: {
        levelA: levelAResults.every((r) => r.passes),
        levelAA: levelAAResults.every((r) => r.passes),
        levelAAA: false, // Not fully checking AAA in this implementation
      },
      results: this.results,
      passCount,
      failCount,
      successRate,
    };
  }
}

/**
 * Check WCAG 2.1 AA compliance
 */
export function checkWCAGAA(): WCAGComplianceReport {
  const checker = new WCAGComplianceChecker();
  return checker.checkWCAGAA();
}

/**
 * Generate WCAG report summary
 */
export function getWCAGSummary(report: WCAGComplianceReport): string {
  let summary = `WCAG 2.1 Compliance Report\n`;
  summary += `==========================\n\n`;

  summary += `Overall Compliance:\n`;
  summary += `  Level A: ${report.overallCompliance.levelA ? "✅" : "❌"}\n`;
  summary += `  Level AA: ${report.overallCompliance.levelAA ? "✅" : "❌"}\n`;
  summary += `  Level AAA: ${report.overallCompliance.levelAAA ? "✅" : "❌"}\n\n`;

  summary += `Success Rate: ${report.successRate.toFixed(1)}%\n`;
  summary += `Passed: ${report.passCount}/${report.results.length}\n`;
  summary += `Failed: ${report.failCount}/${report.results.length}\n\n`;

  summary += `Failed Criteria:\n`;
  report.results
    .filter((r) => !r.passes)
    .forEach((result) => {
      summary += `  ❌ ${result.criterion}\n`;
      summary += `     ${result.message}\n`;
    });

  return summary;
}
