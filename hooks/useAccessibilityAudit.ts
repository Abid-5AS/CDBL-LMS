/**
 * useAccessibilityAudit Hook
 *
 * React hook for running accessibility audits in components
 */

import { useEffect, useState, useCallback } from "react";
import {
  runAccessibilityAudit,
  getAuditSummary,
  type AccessibilityAuditResult,
} from "@/lib/accessibility/audit";
import {
  checkWCAGAA,
  getWCAGSummary,
  type WCAGComplianceReport,
} from "@/lib/accessibility/wcag";

/**
 * Audit state
 */
export interface AuditState {
  audit: AccessibilityAuditResult | null;
  wcag: WCAGComplianceReport | null;
  isRunning: boolean;
  error: Error | null;
}

/**
 * Hook options
 */
interface UseAccessibilityAuditOptions {
  /** Run audit automatically */
  autoRun?: boolean;

  /** Run audit on intervals (ms) */
  intervalMs?: number;

  /** Log results to console */
  logResults?: boolean;

  /** Include WCAG compliance check */
  checkWCAG?: boolean;
}

/**
 * Hook to run accessibility audits
 *
 * Provides accessibility auditing capabilities for components
 *
 * @example
 * ```typescript
 * function AccessibilityMonitor() {
 *   const { audit, wcag, runAudit, isRunning } = useAccessibilityAudit({
 *     autoRun: true,
 *     intervalMs: 10000,
 *     logResults: true
 *   });
 *
 *   if (!audit) return <div>Running audit...</div>;
 *
 *   return (
 *     <div>
 *       <p>Score: {audit.scorePercentage}%</p>
 *       <p>Issues: {audit.totalIssues}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccessibilityAudit(
  options: UseAccessibilityAuditOptions = {}
) {
  const {
    autoRun = false,
    intervalMs = 30000,
    logResults = false,
    checkWCAG = true,
  } = options;

  const [state, setState] = useState<AuditState>({
    audit: null,
    wcag: null,
    isRunning: false,
    error: null,
  });

  // Run audit
  const runAudit = useCallback(async () => {
    setState((prev) => ({ ...prev, isRunning: true, error: null }));

    try {
      // Run accessibility audit
      const audit = runAccessibilityAudit();

      // Run WCAG check if enabled
      let wcag: WCAGComplianceReport | null = null;
      if (checkWCAG) {
        wcag = checkWCAGAA();
      }

      setState({
        audit,
        wcag,
        isRunning: false,
        error: null,
      });

      // Log results if enabled
      if (logResults) {
        console.group("🔍 Accessibility Audit Results");
        console.log(getAuditSummary(audit));
        if (wcag) {
          console.log(getWCAGSummary(wcag));
        }
        if (audit.issues.length > 0) {
          console.table(
            audit.issues.map((issue) => ({
              type: issue.type,
              severity: issue.severity,
              message: issue.message,
              wcag: issue.wcagCriteria,
            }))
          );
        }
        console.groupEnd();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: err,
      }));

      if (logResults) {
        console.error("Accessibility audit failed:", err);
      }
    }
  }, [checkWCAG, logResults]);

  // Auto-run on mount
  useEffect(() => {
    if (autoRun) {
      runAudit();
    }
  }, [autoRun, runAudit]);

  // Set up interval if enabled
  useEffect(() => {
    if (!autoRun || intervalMs <= 0) {
      return;
    }

    const interval = setInterval(() => {
      runAudit();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoRun, intervalMs, runAudit]);

  // Get specific issue type count
  const getIssueCount = useCallback(
    (type: string): number => {
      if (!state.audit) return 0;
      return state.audit.issues.filter((issue) => issue.type === type).length;
    },
    [state.audit]
  );

  // Get issues by severity
  const getIssuesBySeverity = useCallback(
    (severity: "error" | "warning" | "notice") => {
      if (!state.audit) return [];
      return state.audit.issues.filter((issue) => issue.severity === severity);
    },
    [state.audit]
  );

  // Get WCAG compliance status
  const getWCAGStatus = useCallback(() => {
    if (!state.wcag) return null;

    return {
      levelA: state.wcag.overallCompliance.levelA,
      levelAA: state.wcag.overallCompliance.levelAA,
      levelAAA: state.wcag.overallCompliance.levelAAA,
      passRate: state.wcag.successRate,
    };
  }, [state.wcag]);

  // Export audit as JSON
  const exportAsJSON = useCallback((): string => {
    return JSON.stringify(
      {
        audit: state.audit,
        wcag: state.wcag,
        timestamp: Date.now(),
      },
      null,
      2
    );
  }, [state.audit, state.wcag]);

  // Export audit as CSV
  const exportAsCSV = useCallback((): string => {
    if (!state.audit) return "";

    let csv = "Type,Severity,Message,WCAG,Suggestion\n";
    state.audit.issues.forEach((issue) => {
      csv += `"${issue.type}","${issue.severity}","${issue.message.replace(/"/g, '""')}","${issue.wcagCriteria}","${issue.suggestion.replace(/"/g, '""')}"\n`;
    });

    return csv;
  }, [state.audit]);

  return {
    // State
    audit: state.audit,
    wcag: state.wcag,
    isRunning: state.isRunning,
    error: state.error,

    // Actions
    runAudit,

    // Getters
    getIssueCount,
    getIssuesBySeverity,
    getWCAGStatus,

    // Export
    exportAsJSON,
    exportAsCSV,

    // Info
    hasErrors: state.audit ? state.audit.errors > 0 : false,
    hasWarnings: state.audit ? state.audit.warnings > 0 : false,
    score: state.audit?.scorePercentage ?? 0,
  };
}
