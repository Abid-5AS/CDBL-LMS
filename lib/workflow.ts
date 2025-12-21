import type { AppRole } from "./rbac";
import type { LeaveType } from "@/src/generated/prisma/client";

export const MASTER_WORKFLOW_CHAIN: AppRole[] = [
  "DEPT_HEAD",
  "HR_ADMIN",
  "HR_HEAD",
  "CEO",
];

export const WORKFLOW_CHAINS: Record<LeaveType | "DEFAULT", AppRole[]> = {
  // All leave types now follow the master chain logic
  DEFAULT: MASTER_WORKFLOW_CHAIN,
  EARNED: MASTER_WORKFLOW_CHAIN,
  CASUAL: MASTER_WORKFLOW_CHAIN,
  MEDICAL: MASTER_WORKFLOW_CHAIN,
  EXTRAWITHPAY: MASTER_WORKFLOW_CHAIN,
  EXTRAWITHOUTPAY: MASTER_WORKFLOW_CHAIN,
  MATERNITY: MASTER_WORKFLOW_CHAIN,
  PATERNITY: MASTER_WORKFLOW_CHAIN,
  STUDY: MASTER_WORKFLOW_CHAIN,
  SPECIAL_DISABILITY: MASTER_WORKFLOW_CHAIN,
  QUARANTINE: MASTER_WORKFLOW_CHAIN,
  SPECIAL: MASTER_WORKFLOW_CHAIN,
};

// Deprecated: No longer used as a separate chain, resolved dynamically
export const DEPT_HEAD_WORKFLOW_CHAIN: AppRole[] = ["HR_ADMIN", "HR_HEAD", "CEO"];

export type LeaveStatus = "DRAFT" | "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED" | "CANCELLATION_REQUESTED" | "RECALLED";

export type ApprovalAction = "FORWARD" | "APPROVE" | "REJECT" | "RETURN";

export function getChainFor(type: LeaveType, requesterRole?: AppRole): AppRole[] {
  // Master Chain: DEPT_HEAD -> HR_ADMIN -> HR_HEAD -> CEO

  if (!requesterRole || requesterRole === "EMPLOYEE") {
    return MASTER_WORKFLOW_CHAIN;
  }

  const masterChain = MASTER_WORKFLOW_CHAIN;
  const roleIndex = masterChain.indexOf(requesterRole);

  if (roleIndex !== -1 && roleIndex < masterChain.length - 1) {
    // Return the sub-chain starting after the requester
    return masterChain.slice(roleIndex + 1);
  }

  if (requesterRole === "CEO") {
    return [];
  }

  return WORKFLOW_CHAINS[type] ?? WORKFLOW_CHAINS.DEFAULT;
}

export function isFinalApprover(role: AppRole, type: LeaveType, requesterRole?: AppRole): boolean {
  const chain = getChainFor(type, requesterRole);
  return chain.length > 0 && chain[chain.length - 1] === role;
}

export function getNextRoleInChain(currentRole: AppRole, type: LeaveType, requesterRole?: AppRole): AppRole | null {
  const chain = getChainFor(type, requesterRole);
  const currentIndex = chain.indexOf(currentRole);

  if (currentIndex === -1 || currentIndex === chain.length - 1) {
    return null;
  }

  return chain[currentIndex + 1];
}

export function getStepForRole(role: AppRole, type: LeaveType, requesterRole?: AppRole): number {
  const chain = getChainFor(type, requesterRole);
  const index = chain.indexOf(role);
  return index === -1 ? 0 : index + 1; // 1-based step
}

export function canPerformAction(role: AppRole, action: ApprovalAction, type?: LeaveType, requesterRole?: AppRole): boolean {
  // If type is provided, use per-type chain logic
  if (type) {
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
        return true; // Any approver in the chain can return requests for modification
      default:
        return false;
    }
  }

  // Fallback to legacy logic for backward compatibility (should be avoided)
  switch (action) {
    case "FORWARD":
      return role === "HR_ADMIN" || role === "HR_HEAD" || role === "DEPT_HEAD";
    case "APPROVE":
    case "REJECT":
      return role === "DEPT_HEAD" || role === "CEO" || role === "SYSTEM_ADMIN" || role === "HR_HEAD";
    case "RETURN":
      return role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO" || role === "DEPT_HEAD" || role === "SYSTEM_ADMIN";
    default:
      return false;
  }
}

export function canForwardTo(actorRole: AppRole, targetRole: AppRole, type: LeaveType, requesterRole?: AppRole): boolean {
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
  if (action === "APPROVE") {
    return "APPROVED";
  }
  if (action === "REJECT") {
    return "REJECTED";
  }
  if (action === "FORWARD") {
    return "PENDING";
  }
  return currentStatus;
}
