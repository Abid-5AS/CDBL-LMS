import type { AppRole } from "./rbac";

/**
 * Approval chain order - must be followed sequentially
 */
export const APPROVAL_CHAIN: AppRole[] = ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"];

export type LeaveStatus = "DRAFT" | "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type ApprovalAction = "FORWARD" | "APPROVE" | "REJECT";

/**
 * Get the next role in the approval chain after the current role
 */
export function getNextRoleInChain(currentRole: AppRole): AppRole | null {
  const currentIndex = APPROVAL_CHAIN.indexOf(currentRole);
  if (currentIndex === -1 || currentIndex >= APPROVAL_CHAIN.length - 1) {
    return null; // No next role (current role is last or not in chain)
  }
  return APPROVAL_CHAIN[currentIndex + 1];
}

/**
 * Get the step number for a role in the approval chain
 */
export function getStepForRole(role: AppRole): number {
  const index = APPROVAL_CHAIN.indexOf(role);
  return index === -1 ? 0 : index + 1; // Steps are 1-indexed
}

/**
 * Check if a role can perform a specific action
 */
export function canPerformAction(role: AppRole, action: ApprovalAction): boolean {
  switch (action) {
    case "FORWARD":
      // HR_ADMIN and DEPT_HEAD can forward (intermediate roles)
      return role === "HR_ADMIN" || role === "DEPT_HEAD";
    case "APPROVE":
    case "REJECT":
      // Only HR_HEAD and CEO can approve/reject
      return role === "HR_HEAD" || role === "CEO";
    default:
      return false;
  }
}

/**
 * Check if a role can forward to a target role (must be next in chain)
 */
export function canForwardTo(actorRole: AppRole, targetRole: AppRole): boolean {
  const nextRole = getNextRoleInChain(actorRole);
  return nextRole === targetRole;
}

/**
 * Get the initial status after employee submits
 */
export function getInitialStatus(): LeaveStatus {
  return "SUBMITTED"; // Employee submits → goes to HR_ADMIN first
}

/**
 * Get the next status after an action
 */
export function getStatusAfterAction(
  currentStatus: LeaveStatus,
  action: ApprovalAction,
  targetRole?: AppRole
): LeaveStatus {
  if (action === "APPROVE") {
    return "APPROVED";
  }
  if (action === "REJECT") {
    return "REJECTED";
  }
  if (action === "FORWARD") {
    // If forwarded to CEO, status remains PENDING
    // If forwarded to HR_HEAD from DEPT_HEAD, status remains PENDING
    return "PENDING";
  }
  return currentStatus;
}

