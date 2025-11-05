import type { AppRole } from "./rbac";
import type { LeaveType } from "@prisma/client";

/**
 * Per-type approval chains as per Policy 6.10
 * Policy: "Applications (except Casual Leave) sent through Dept Head → HRD → Management."
 * CASUAL uses shorter chain per Policy 6.10 exception
 */
export const WORKFLOW_CHAINS: Record<LeaveType | "DEFAULT", AppRole[]> = {
  DEFAULT: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"], // Default chain for EL, ML, etc.
  EARNED: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  CASUAL: ["DEPT_HEAD"], // Provisional: CL uses shorter chain per Policy 6.10
  MEDICAL: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  EXTRAWITHPAY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  EXTRAWITHOUTPAY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  MATERNITY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  PATERNITY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  STUDY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  SPECIAL_DISABILITY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  QUARANTINE: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
};

/**
 * Legacy APPROVAL_CHAIN for backward compatibility
 * @deprecated Use getChainFor() instead
 */
export const APPROVAL_CHAIN: AppRole[] = WORKFLOW_CHAINS.DEFAULT;

export type LeaveStatus = "DRAFT" | "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED" | "CANCELLATION_REQUESTED" | "RECALLED";

export type ApprovalAction = "FORWARD" | "APPROVE" | "REJECT";

/**
 * Get the approval chain for a specific leave type
 */
export function getChainFor(type: LeaveType): AppRole[] {
  return WORKFLOW_CHAINS[type] ?? WORKFLOW_CHAINS.DEFAULT;
}

/**
 * Get the next role in the approval chain after the current role for a specific leave type
 */
export function getNextRoleInChain(currentRole: AppRole, type?: LeaveType): AppRole | null {
  const chain = type ? getChainFor(type) : APPROVAL_CHAIN;
  const currentIndex = chain.indexOf(currentRole);
  if (currentIndex === -1 || currentIndex >= chain.length - 1) {
    return null; // No next role (current role is last or not in chain)
  }
  return chain[currentIndex + 1];
}

/**
 * Get the step number for a role in the approval chain for a specific leave type
 */
export function getStepForRole(role: AppRole, type?: LeaveType): number {
  const chain = type ? getChainFor(type) : APPROVAL_CHAIN;
  const index = chain.indexOf(role);
  return index === -1 ? 0 : index + 1; // Steps are 1-indexed
}

/**
 * Check if a role is the final approver in the chain for a specific leave type
 */
export function isFinalApprover(role: AppRole, type: LeaveType): boolean {
  const chain = getChainFor(type);
  return chain.length > 0 && chain[chain.length - 1] === role;
}

/**
 * Check if a role can perform a specific action for a specific leave type
 * Rules:
 * - FORWARD: Allowed if not final approver (intermediate steps)
 * - APPROVE/REJECT: Allowed only if final approver
 */
export function canPerformAction(role: AppRole, action: ApprovalAction, type?: LeaveType): boolean {
  // If type is provided, use per-type chain logic
  if (type) {
    const chain = getChainFor(type);
    const isFinal = chain.length > 0 && chain[chain.length - 1] === role;
    
    switch (action) {
      case "FORWARD":
        return !isFinal && chain.includes(role); // Can forward if not final
      case "APPROVE":
      case "REJECT":
        return isFinal; // Can approve/reject only if final
      default:
        return false;
    }
  }
  
  // Fallback to legacy logic for backward compatibility
  switch (action) {
    case "FORWARD":
      return role === "HR_ADMIN" || role === "DEPT_HEAD";
    case "APPROVE":
    case "REJECT":
      return role === "HR_HEAD" || role === "CEO";
    default:
      return false;
  }
}

/**
 * Check if a role can forward to a target role (must be next in chain for the leave type)
 */
export function canForwardTo(actorRole: AppRole, targetRole: AppRole, type?: LeaveType): boolean {
  const nextRole = getNextRoleInChain(actorRole, type);
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

