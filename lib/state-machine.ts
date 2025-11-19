import type { LeaveStatus } from "@prisma/client";

/**
 * Leave Request State Machine
 * Defines allowed status transitions to prevent unauthorized modifications
 *
 * Security: Once a leave is APPROVED, it can ONLY transition to CANCELLATION_REQUESTED
 * This prevents the resubmit exploit where status reverts to PENDING
 */
export const ALLOWED_TRANSITIONS: Record<LeaveStatus, LeaveStatus[]> = {
  // Draft can be submitted or cancelled
  DRAFT: ["SUBMITTED", "CANCELLED"],

  // Submitted enters the approval workflow
  SUBMITTED: ["PENDING", "RETURNED", "CANCELLED"],

  // Pending can be approved, rejected, returned for modification, or cancelled
  PENDING: ["APPROVED", "REJECTED", "RETURNED", "CANCELLED"],

  // APPROVED is a protected state - can only request cancellation
  // CRITICAL: Cannot revert to PENDING (prevents resubmit exploit)
  APPROVED: ["CANCELLATION_REQUESTED"],

  // Terminal states - no transitions allowed
  REJECTED: [],
  CANCELLED: [],

  // Returned can be resubmitted (becomes PENDING) or cancelled
  RETURNED: ["PENDING", "CANCELLED", "SUBMITTED"],

  // Cancellation request can be approved (becomes CANCELLED) or rejected (reverts to APPROVED)
  CANCELLATION_REQUESTED: ["CANCELLED", "APPROVED"],

  // Recalled requests can be resubmitted
  RECALLED: ["SUBMITTED", "CANCELLED"],
};

/**
 * Check if a status transition is valid
 * @param from - Current status
 * @param to - Target status
 * @returns true if transition is allowed
 */
export function canTransition(from: LeaveStatus, to: LeaveStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate a status transition and throw if invalid
 * @param currentStatus - Current leave status
 * @param newStatus - Requested new status
 * @throws Error if transition is not allowed
 */
export function validateStatusTransition(
  currentStatus: LeaveStatus,
  newStatus: LeaveStatus
): void {
  if (currentStatus === newStatus) {
    // Same status is allowed (idempotent updates)
    return;
  }

  if (!canTransition(currentStatus, newStatus)) {
    const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
      `Allowed transitions from ${currentStatus}: ${allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "none (terminal state)"}`
    );
  }
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: LeaveStatus): boolean {
  return ALLOWED_TRANSITIONS[status]?.length === 0;
}

/**
 * Check if a leave can be modified based on its status
 * APPROVED, REJECTED, and CANCELLED leaves are immutable
 */
export function canModifyLeave(status: LeaveStatus): boolean {
  return !["APPROVED", "REJECTED", "CANCELLED"].includes(status);
}

/**
 * Get next possible statuses for a given current status
 */
export function getNextStatuses(currentStatus: LeaveStatus): LeaveStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a leave is in an active state (not terminal, not cancelled)
 */
export function isActiveStatus(status: LeaveStatus): boolean {
  return !["REJECTED", "CANCELLED"].includes(status);
}

/**
 * Check if a leave is in approval workflow
 */
export function isInApprovalWorkflow(status: LeaveStatus): boolean {
  return ["SUBMITTED", "PENDING"].includes(status);
}

/**
 * Validate that critical fields haven't changed for approved leaves
 */
export function validateImmutableFields(
  originalLeave: {
    status: LeaveStatus;
    type: string;
    startDate: Date;
    endDate: Date;
    workingDays: number;
  },
  newData: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
    workingDays?: number;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // If leave is APPROVED, critical fields are immutable
  if (originalLeave.status === "APPROVED") {
    if (newData.type && newData.type !== originalLeave.type) {
      errors.push("Cannot change leave type after approval");
    }
    if (newData.startDate && newData.startDate.getTime() !== originalLeave.startDate.getTime()) {
      errors.push("Cannot change start date after approval");
    }
    if (newData.endDate && newData.endDate.getTime() !== originalLeave.endDate.getTime()) {
      errors.push("Cannot change end date after approval");
    }
    if (newData.workingDays && newData.workingDays !== originalLeave.workingDays) {
      errors.push("Cannot change working days after approval");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * State machine visualization for documentation
 */
export const STATE_MACHINE_DIAGRAM = `
Leave Request State Machine
============================

DRAFT
  ├─→ SUBMITTED
  └─→ CANCELLED (terminal)

SUBMITTED
  ├─→ PENDING (enters approval chain)
  ├─→ RETURNED (needs modification)
  └─→ CANCELLED (terminal)

PENDING
  ├─→ APPROVED (final approval) ⚠️ PROTECTED STATE
  ├─→ REJECTED (terminal)
  ├─→ RETURNED (needs modification)
  └─→ CANCELLED (terminal)

APPROVED ⚠️
  └─→ CANCELLATION_REQUESTED (only allowed transition)

RETURNED
  ├─→ PENDING (resubmitted)
  ├─→ SUBMITTED (resubmitted)
  └─→ CANCELLED (terminal)

CANCELLATION_REQUESTED
  ├─→ CANCELLED (approved cancellation)
  └─→ APPROVED (rejected cancellation)

REJECTED (terminal)
CANCELLED (terminal)

⚠️ SECURITY NOTE: APPROVED status can ONLY transition to CANCELLATION_REQUESTED
   This prevents the resubmit exploit where status could revert to PENDING
`;
