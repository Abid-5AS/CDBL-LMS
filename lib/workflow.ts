import { LeaveType, Role } from "@/src/generated/prisma/client";
import { AppRole } from "@/lib/rbac";

/**
 * WORKFLOW MATRIX
 * Defines the approval chain for each requester role.
 * 
 * Row: Requester Role
 * Column: Ordered list of Approver Roles
 */
const ROLE_WORKFLOW_MATRIX: Record<AppRole, Role[]> = {
  EMPLOYEE: ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"],
  DEPT_HEAD: ["HR_HEAD", "CEO"],
  HR_ADMIN: ["HR_HEAD", "CEO"],
  HR_HEAD: ["CEO"],
  CEO: [], // Self-approves (handled by empty chain)
  SYSTEM_ADMIN: [] // Handled as CEO or special case
};

/**
 * Get the full approval chain for a specific leave request context.
 * 
 * @param type - The type of leave (e.g., CASUAL, MEDICAL)
 * @param requesterRole - The role of the person asking for leave
 * @returns An array of Roles representing the approval steps in order
 */
export function getChainFor(type: LeaveType, requesterRole: AppRole): Role[] {
  // 1. Get Base Chain from Matrix
  const chain = ROLE_WORKFLOW_MATRIX[requesterRole] || [];

  // 2. Apply Policy Overrides (Condition-Based Logic)
  // Example: If needed, filter for specific types here
  // if (type === 'CASUAL') { ... }

  return chain;
}

/**
 * Get the next role in the chain relative to the current approver.
 * 
 * @param currentApproverRole - The role of the person who just approved
 * @param leaveType - The type of leave
 * @param requesterRole - The role of the original requester
 */
export function getNextRoleInChain(
  currentApproverRole: Role,
  leaveType: LeaveType,
  requesterRole: AppRole
): Role | null {
  const chain = getChainFor(leaveType, requesterRole);
  const currentIndex = chain.indexOf(currentApproverRole);

  if (currentIndex === -1 || currentIndex === chain.length - 1) {
    return null; // End of chain or invalid role
  }

  return chain[currentIndex + 1];
}

/**
 * Check if the final approver in the chain has approved.
 * This determines if the leave request should transition to APPROVED.
 */
export function isFinalApprover(
  currentApproverRole: Role,
  leaveType: LeaveType,
  requesterRole: AppRole
): boolean {
  const chain = getChainFor(leaveType, requesterRole);
  const lastRole = chain[chain.length - 1];
  return currentApproverRole === lastRole;
}

/**
 * Get the step number (1-indexed) for a specific role in the chain.
 */
export function getStepForRole(
  approverRole: Role,
  leaveType: LeaveType,
  requesterRole: AppRole
): number {
  const chain = getChainFor(leaveType, requesterRole);
  const index = chain.indexOf(approverRole);
  return index !== -1 ? index + 1 : 0;
}

export type LeaveStatus = "DRAFT" | "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED" | "CANCELLATION_REQUESTED" | "RECALLED";
export type ApprovalAction = "FORWARD" | "APPROVE" | "REJECT" | "RETURN";

/**
 * Check if a role can perform a specific action on a leave request.
 */
export function canPerformAction(role: AppRole, action: ApprovalAction, type?: LeaveType, requesterRole?: AppRole): boolean {
  if (type && requesterRole) {
    const chain = getChainFor(type, requesterRole);
    const isFinal = chain.length > 0 && chain[chain.length - 1] === role;
    const isInChain = chain.includes(role);

    if (!isInChain) return false;

    switch (action) {
      case "FORWARD":
        return !isFinal; // Can forward if not final
      case "APPROVE":
        return isFinal; // Can approve only if final
      case "REJECT":
        return true; // Any approver in chain can reject
      case "RETURN":
        return true; // Any approver in the chain can return requests
      default:
        return false;
    }
  }

  // Basic fallback
  return true;
}

export function canForwardTo(actorRole: AppRole, targetRole: AppRole, type: LeaveType, requesterRole?: AppRole): boolean {
  // Usually strict forwarding: Must forward to next in chain
  const nextRole = getNextRoleInChain(actorRole, type, requesterRole);
  return nextRole === targetRole;
}

export function getInitialStatus(): LeaveStatus {
  return "SUBMITTED";
}

export function getStatusAfterAction(
  currentStatus: LeaveStatus,
  action: ApprovalAction,
  targetRole?: AppRole
): LeaveStatus {
  if (action === "APPROVE") return "APPROVED";
  if (action === "REJECT") return "REJECTED";
  if (action === "FORWARD") return "PENDING";
  if (action === "RETURN") return "RETURNED";
  return currentStatus;
}
