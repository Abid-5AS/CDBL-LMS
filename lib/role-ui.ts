/**
 * Role-Aware Dock & UI Guardrails (Policy v2.0)
 *
 * Authoritative sources:
 * - /docs/Policy Logic/09-Role Based Behavior.md
 * - /docs/Policy Logic/06-Approval Workflow and Chain.md
 * - /docs/Policy Logic/02-Leave Application Rules and Validation.md
 * - /docs/Policy Logic/10-System Messages and Error Handling.md
 *
 * This module provides a canonical mapping of Role × Page → Dock actions
 * with strict enforcement to prevent mixing employee/admin features.
 */

import type { AppRole } from "./rbac";

export type Role = AppRole;

export type Page =
  | "DASHBOARD"
  | "LEAVES_LIST"
  | "LEAVES_APPLY"
  | "APPROVALS"
  | "EMPLOYEES"
  | "REPORTS"
  | "POLICIES"
  | "AUDIT";

export type Action =
  | "APPLY_LEAVE"
  | "MY_REQUESTS"
  | "DASHBOARD"
  | "APPROVAL_QUEUE"
  | "REVIEW_REQUESTS"
  | "EMPLOYEE_DIRECTORY"
  | "REPORTS"
  | "AUDIT_LOGS"
  | "VIEW_POLICY"
  | "EXPORT_CSV"
  | "BULK_APPROVE"
  | "BULK_REJECT";

/**
 * Canonical mapping: Role × Page → Allowed Actions
 *
 * Rules:
 * - EMPLOYEE: No admin actions (EXPORT_CSV, REPORTS, AUDIT_LOGS, BULK_APPROVE, BULK_REJECT)
 * - BULK actions only when hasSelection=true
 * - EXPORT_CSV only when hasTabularData=true
 * - HR/Admin roles get admin actions
 * - CEO gets executive actions only
 */
export const DOCK_MATRIX: Record<Role, Partial<Record<Page, Action[]>>> = {
  EMPLOYEE: {
    DASHBOARD: ["APPLY_LEAVE", "MY_REQUESTS", "VIEW_POLICY"],
    // Note: On the employee /leaves list we prioritize quick self-navigation over policy view.
    // "MY_REQUESTS" is the active context link; "VIEW_POLICY" remains available from top nav.
    LEAVES_LIST: ["APPLY_LEAVE", "MY_REQUESTS", "DASHBOARD"],
    LEAVES_APPLY: ["MY_REQUESTS", "DASHBOARD"],
  },
  DEPT_HEAD: {
    DASHBOARD: ["APPROVAL_QUEUE", "MY_REQUESTS", "VIEW_POLICY"],
    LEAVES_LIST: ["APPLY_LEAVE", "APPROVAL_QUEUE", "VIEW_POLICY"],
    LEAVES_APPLY: ["MY_REQUESTS", "APPROVAL_QUEUE"],
    APPROVALS: ["APPROVAL_QUEUE", "BULK_APPROVE", "BULK_REJECT"],
  },
  HR_ADMIN: {
    DASHBOARD: ["APPLY_LEAVE", "APPROVAL_QUEUE", "EMPLOYEE_DIRECTORY", "VIEW_POLICY"],
    LEAVES_LIST: ["APPLY_LEAVE", "REVIEW_REQUESTS", "EXPORT_CSV", "VIEW_POLICY"],
    APPROVALS: ["APPROVAL_QUEUE", "BULK_APPROVE", "BULK_REJECT", "EXPORT_CSV"],
    EMPLOYEES: ["EMPLOYEE_DIRECTORY", "APPROVAL_QUEUE"],
    REPORTS: ["EXPORT_CSV"],
  },
  HR_HEAD: {
    DASHBOARD: ["APPLY_LEAVE", "REPORTS", "APPROVAL_QUEUE", "VIEW_POLICY"],
    APPROVALS: ["APPROVAL_QUEUE", "BULK_APPROVE", "BULK_REJECT", "EXPORT_CSV"],
    REPORTS: ["EXPORT_CSV"],
    LEAVES_LIST: ["APPLY_LEAVE", "REVIEW_REQUESTS", "EXPORT_CSV"],
  },
  CEO: {
    DASHBOARD: ["REPORTS", "AUDIT_LOGS", "VIEW_POLICY"],
    REPORTS: ["EXPORT_CSV"],
    AUDIT: ["EXPORT_CSV"],
  },
  SYSTEM_ADMIN: {
    DASHBOARD: ["APPLY_LEAVE", "APPROVAL_QUEUE", "EMPLOYEE_DIRECTORY", "REPORTS", "AUDIT_LOGS", "VIEW_POLICY"],
    LEAVES_LIST: ["APPLY_LEAVE", "REVIEW_REQUESTS", "EXPORT_CSV", "VIEW_POLICY"],
    APPROVALS: ["APPROVAL_QUEUE", "BULK_APPROVE", "BULK_REJECT", "EXPORT_CSV"],
    EMPLOYEES: ["EMPLOYEE_DIRECTORY", "APPROVAL_QUEUE"],
    REPORTS: ["EXPORT_CSV"],
    AUDIT: ["EXPORT_CSV"],
  },
};

/**
 * Get allowed dock actions for a role and page with context pruning
 *
 * @param role - User's role
 * @param page - Current page context
 * @param opts - Optional context for pruning actions
 * @returns Array of allowed actions
 */
export function getDockActions(
  role: Role,
  page: Page,
  opts?: {
    hasSelection?: boolean;
    hasTabularData?: boolean;
  }
): Action[] {
  // Get base actions from matrix
  const base = DOCK_MATRIX[role]?.[page] ?? [];

  // If no options provided, return base actions without pruning
  if (!opts) {
    return base;
  }

  // Context pruning: remove bulk actions if hasSelection is explicitly false
  let filtered = opts.hasSelection
    ? base
    : base.filter((a) => !["BULK_APPROVE", "BULK_REJECT"].includes(a));

  // Context pruning: remove CSV export if hasTabularData is explicitly false
  filtered = opts.hasTabularData
    ? filtered
    : filtered.filter((a) => a !== "EXPORT_CSV");

  return filtered;
}

/**
 * Resolve highest authority role from multiple roles
 * Hierarchy: CEO > HR_HEAD > HR_ADMIN > DEPT_HEAD > EMPLOYEE
 *
 * @param roles - Array of roles
 * @returns Highest authority role
 */
export function resolveHighestAuthority(roles: Role[]): Role {
  const hierarchy: Record<Role, number> = {
    SYSTEM_ADMIN: 6,
    CEO: 5,
    HR_HEAD: 4,
    HR_ADMIN: 3,
    DEPT_HEAD: 2,
    EMPLOYEE: 1,
  };

  return roles.reduce((highest, current) => {
    return hierarchy[current] > hierarchy[highest] ? current : highest;
  }, roles[0]);
}

/**
 * Check if an action is banned for a role
 *
 * @param role - User's role
 * @param action - Action to check
 * @returns true if banned
 */
export function isActionBanned(role: Role, action: Action): boolean {
  // Banned actions for EMPLOYEE
  if (role === "EMPLOYEE") {
    return [
      "EXPORT_CSV",
      "REPORTS",
      "AUDIT_LOGS",
      "BULK_APPROVE",
      "BULK_REJECT",
    ].includes(action);
  }
  return false;
}

/**
 * Convert a route pathname to a canonical Page key
 *
 * @param pathname - Current pathname
 * @returns Page key or undefined if unknown
 */
export function routeToPage(pathname: string): Page | undefined {
  if (!pathname) return undefined;

  // Normalize pathname
  const p = pathname.toLowerCase();

  if (p === "/" || p.startsWith("/dashboard")) return "DASHBOARD";
  if (p === "/leaves" || p.startsWith("/leaves?")) return "LEAVES_LIST";
  if (p.startsWith("/leaves/apply")) return "LEAVES_APPLY";
  if (p.startsWith("/approvals")) return "APPROVALS";
  if (p.startsWith("/employees")) return "EMPLOYEES";
  if (p.startsWith("/reports")) return "REPORTS";
  if (p.startsWith("/policies")) return "POLICIES";
  if (p.includes("/audit")) return "AUDIT";

  return undefined;
}

/**
 * Check if a page is unknown (not in canonical Page type)
 *
 * @param pathname - Current pathname
 * @returns true if unknown
 */
export function isUnknownPage(pathname: string): boolean {
  return routeToPage(pathname) === undefined;
}

/**
 * Validate that no employee actions leak into admin context
 *
 * @param role - User's role
 * @param actions - Actions to validate
 * @throws Error if validation fails
 */
export function validateRoleActions(role: Role, actions: Action[]): void {
  for (const action of actions) {
    if (isActionBanned(role, action)) {
      throw new Error(
        `Action '${action}' is banned for role '${role}'. Check DOCK_MATRIX configuration.`
      );
    }
  }
}

/**
 * Runtime assertion for dock actions (dev mode only)
 *
 * @param role - User's role
 * @param page - Current page
 * @param actions - Actions to validate
 */
export function assertValidDockActions(
  role: Role,
  page: Page,
  actions: Action[]
): void {
  if (process.env.NODE_ENV === "development") {
    try {
      validateRoleActions(role, actions);
    } catch (error) {
      console.error("[Dock Assertion Failed]", {
        role,
        page,
        actions,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
