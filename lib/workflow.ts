import type { AppRole } from "./rbac";
import type { LeaveType } from "@prisma/client";

/**
 * Per-type approval chains - Updated 2025-11-17
 * New approval flow: Employee → HR_ADMIN → HR_HEAD → DEPT_HEAD (final approval for employees)
 * Special case: DEPT_HEAD → HR_ADMIN → HR_HEAD → CEO (when dept head applies for leave)
 * All cancellation requests (including partial) follow the same approval flow
 */
export const WORKFLOW_CHAINS: Record<LeaveType | "DEFAULT", AppRole[]> = {
  DEFAULT: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"], // Default chain for regular employees
  EARNED: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  CASUAL: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  MEDICAL: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  EXTRAWITHPAY: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  EXTRAWITHOUTPAY: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  MATERNITY: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  PATERNITY: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  STUDY: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  SPECIAL_DISABILITY: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  QUARANTINE: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"],
  SPECIAL: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"], // EL overflow >60 days (Policy 6.19.c)
};

/**
 * Approval chain for department heads applying for leave
 * Dept Head → HR_ADMIN → HR_HEAD → CEO (final approval)
 */
export const DEPT_HEAD_WORKFLOW_CHAIN: AppRole[] = ["CEO"];

/**
 * Legacy APPROVAL_CHAIN for backward compatibility
 * @deprecated Use getChainFor() instead
 */
export const APPROVAL_CHAIN: AppRole[] = WORKFLOW_CHAINS.DEFAULT;

export type LeaveStatus = "DRAFT" | "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED" | "CANCELLATION_REQUESTED" | "RECALLED";

export type ApprovalAction = "FORWARD" | "APPROVE" | "REJECT" | "RETURN";

/**
 * Get the approval chain for a specific leave type and requester role
 * @param type - The leave type
 * @param requesterRole - The role of the person requesting leave (optional)
 * @returns The appropriate approval chain
 */
export function getChainFor(type: LeaveType, requesterRole?: AppRole): AppRole[] {
  // Special case: If dept head is applying for leave, use CEO approval chain
  if (requesterRole === "DEPT_HEAD") {
    return DEPT_HEAD_WORKFLOW_CHAIN;
  }
  
  // Special case: If HR_ADMIN is applying
  if (requesterRole === "HR_ADMIN") {
    return ["HR_HEAD", "DEPT_HEAD"];
  }

  // Special case: If HR_HEAD is applying
  if (requesterRole === "HR_HEAD") {
    return ["DEPT_HEAD"];
  }

  return WORKFLOW_CHAINS[type] ?? WORKFLOW_CHAINS.DEFAULT;
}

/**
 * Get the next role in the approval chain after the current role for a specific leave type
 * @param currentRole - The current approver's role
 * @param type - The leave type (optional)
 * @param requesterRole - The role of the person requesting leave (optional)
 * @returns The next role in the chain, or null if at the end
 */
export function getNextRoleInChain(currentRole: AppRole, type?: LeaveType, requesterRole?: AppRole): AppRole | null {
  const chain = type ? getChainFor(type, requesterRole) : APPROVAL_CHAIN;
  const currentIndex = chain.indexOf(currentRole);
  if (currentIndex === -1 || currentIndex >= chain.length - 1) {
    return null; // No next role (current role is last or not in chain)
  }
  return chain[currentIndex + 1];
}

/**
 * Get the step number for a role in the approval chain for a specific leave type
 * @param role - The role to check
 * @param type - The leave type (optional)
 * @param requesterRole - The role of the person requesting leave (optional)
 * @returns The step number (1-indexed), or 0 if not in chain
 */
export function getStepForRole(role: AppRole, type?: LeaveType, requesterRole?: AppRole): number {
  const chain = type ? getChainFor(type, requesterRole) : APPROVAL_CHAIN;
  const index = chain.indexOf(role);
  return index === -1 ? 0 : index + 1; // Steps are 1-indexed
}

/**
 * Check if a role is the final approver in the chain for a specific leave type
 * @param role - The role to check
 * @param type - The leave type
 * @param requesterRole - The role of the person requesting leave (optional)
 * @returns True if this role is the final approver
 */
export function isFinalApprover(role: AppRole, type: LeaveType, requesterRole?: AppRole): boolean {
  const chain = getChainFor(type, requesterRole);
  return chain.length > 0 && chain[chain.length - 1] === role;
}

/**
 * Check if a role can perform a specific action for a specific leave type
 * Rules:
 * - FORWARD: Allowed if not final approver (intermediate steps)
 * - APPROVE/REJECT: Allowed only if final approver
 * @param role - The role to check
 * @param action - The action to perform
 * @param type - The leave type (optional)
 * @param requesterRole - The role of the person requesting leave (optional)
 */
export function canPerformAction(role: AppRole, action: ApprovalAction, type?: LeaveType, requesterRole?: AppRole): boolean {
  // If type is provided, use per-type chain logic
  if (type) {
    const chain = getChainFor(type, requesterRole);
    const isFinal = chain.length > 0 && chain[chain.length - 1] === role;

    switch (action) {
      case "FORWARD":
        return !isFinal && chain.includes(role); // Can forward if not final
      case "APPROVE":
        return isFinal; // Can approve only if final
      case "REJECT":
        return chain.includes(role); // Any approver in chain can reject
      case "RETURN":
        // Any approver in the chain can return requests for modification
        return chain.includes(role);
      default:
        return false;
    }
  }

  // Fallback to legacy logic for backward compatibility
  switch (action) {
    case "FORWARD":
      return role === "HR_ADMIN" || role === "HR_HEAD";
    case "APPROVE":
    case "REJECT":
      // Updated: DEPT_HEAD can now approve/reject as final approver
      // CEO can approve/reject for dept head leave requests
      return role === "DEPT_HEAD" || role === "CEO" || role === "SYSTEM_ADMIN";
    case "RETURN":
      // Any approver can return requests for modification
      return role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO" || role === "DEPT_HEAD" || role === "SYSTEM_ADMIN";
    default:
      return false;
  }
}

/**
 * Check if a role can forward to a target role (must be next in chain for the leave type)
 * @param actorRole - The role doing the forwarding
 * @param targetRole - The target role to forward to
 * @param type - The leave type (optional)
 * @param requesterRole - The role of the person requesting leave (optional)
 */
export function canForwardTo(actorRole: AppRole, targetRole: AppRole, type?: LeaveType, requesterRole?: AppRole): boolean {
  const nextRole = getNextRoleInChain(actorRole, type, requesterRole);
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

