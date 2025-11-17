/**
 * Workflow utilities for approval flow
 * Updated 2025-11-17: Support role-based approval chains
 */

export interface Approval {
  id: number;
  leaveId: number;
  step: number;
  approverId: number;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FORWARDED';
  toRole?: string | null;
  comment?: string | null;
  decidedAt?: string | null;
  approver: {
    id: number;
    name: string;
    role: string;
  };
}

/**
 * Get approval workflow stages based on requester role
 *
 * Regular Employees: Submitted → HR Admin → HR Head → Dept Head
 * Department Heads: Submitted → HR Admin → HR Head → CEO
 */
export function getWorkflowStages(requesterRole: string): string[] {
  if (requesterRole === 'DEPT_HEAD') {
    return ['Submitted', 'HR Admin', 'HR Head', 'CEO'];
  }
  // Default for employees and other roles
  return ['Submitted', 'HR Admin', 'HR Head', 'Dept Head'];
}

/**
 * Determine if user can approve based on role and requester
 * Only the final approver in the chain can approve
 */
export function canApprove(
  userRole: string,
  requesterRole: string,
  currentStep: number
): boolean {
  const stages = getWorkflowStages(requesterRole);
  const finalApproverRole = stages[stages.length - 1];

  // Map stage names to roles
  const roleMap: Record<string, string> = {
    'HR Admin': 'HR_ADMIN',
    'HR Head': 'HR_HEAD',
    'Dept Head': 'DEPT_HEAD',
    'CEO': 'CEO',
  };

  const finalRole = roleMap[finalApproverRole];
  return userRole === finalRole;
}

/**
 * Determine if user can forward
 * HR_ADMIN and HR_HEAD can forward (they are intermediate steps)
 */
export function canForward(
  userRole: string,
  requesterRole: string
): boolean {
  // HR_ADMIN and HR_HEAD can forward (not final approvers in any workflow)
  return userRole === 'HR_ADMIN' || userRole === 'HR_HEAD';
}

/**
 * Calculate current approval step index
 * Returns the index in the stages array (0-based)
 */
export function calculateCurrentStep(
  approvals: Approval[],
  status: string,
  requesterRole: string
): number {
  const stages = getWorkflowStages(requesterRole);

  // If final status, we're at the last stage
  if (status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELLED') {
    return stages.length - 1;
  }

  // Find completed steps (APPROVED or FORWARDED decisions)
  const completedSteps = approvals
    .filter(a => a.decision === 'APPROVED' || a.decision === 'FORWARDED')
    .map(a => a.step)
    .sort((a, b) => b - a);

  if (completedSteps.length === 0) {
    return 1; // At HR Admin (first step after submission)
  }

  const highestStep = completedSteps[0];

  // Check if the highest step was approved (final approval)
  const highestApproval = approvals.find(a => a.step === highestStep);
  if (highestApproval?.decision === 'APPROVED') {
    return stages.length - 1; // Completed
  }

  // If highest step was forwarded, next step is current
  return Math.min(highestStep + 1, stages.length - 1);
}

/**
 * Get the next approver role name for display
 */
export function getNextApproverRole(currentIndex: number, requesterRole: string): string | null {
  const stages = getWorkflowStages(requesterRole);

  if (currentIndex >= stages.length - 1) {
    return null; // At last stage
  }

  // Skip "Submitted" at index 0, roles start at index 1
  const roles = stages.slice(1); // ["HR Admin", "HR Head", "Dept Head"] or ["HR Admin", "HR Head", "CEO"]
  return roles[currentIndex] || null;
}

/**
 * Determine if user can return a request for modification
 * Approvers can return requests at any stage
 */
export function canReturn(userRole: string): boolean {
  return ['HR_ADMIN', 'HR_HEAD', 'DEPT_HEAD', 'CEO'].includes(userRole);
}

/**
 * Check if a leave can be partially cancelled
 * Can only partially cancel if:
 * - Status is APPROVED
 * - Leave has started (today >= startDate)
 * - Leave hasn't ended yet (today < endDate)
 */
export function canPartiallyCancel(
  leave: {
    status: string;
    startDate: string;
    endDate: string;
  }
): boolean {
  if (leave.status !== 'APPROVED') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(leave.startDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(leave.endDate);
  endDate.setHours(0, 0, 0, 0);

  // Leave must have started and not yet ended
  return today >= startDate && today < endDate;
}
