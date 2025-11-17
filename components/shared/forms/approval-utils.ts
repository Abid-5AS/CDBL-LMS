import { formatDate } from "@/lib/utils";

type ApprovalRecord = {
  step?: number;
  approver?: string | { name: string | null; role?: string } | null;
  decision: string;
  comment?: string | null;
  decidedAt?: string | null;
  toRole?: string | null;
};

/**
 * Get workflow stages based on requester role
 */
function getWorkflowStages(requesterRole?: string): string[] {
  if (requesterRole === "DEPT_HEAD") {
    return ["Submitted", "HR Admin", "HR Head", "CEO"];
  }
  // Default for regular employees
  return ["Submitted", "HR Admin", "HR Head", "Dept Head"];
}

/**
 * Calculate the current stage index for the approval stepper
 * Updated for new workflow: Employee → HR_ADMIN → HR_HEAD → DEPT_HEAD
 *                           Dept Head → HR_ADMIN → HR_HEAD → CEO
 */
export function calculateCurrentStageIndex(
  approvals: ApprovalRecord[],
  status?: string,
  requesterRole?: string
): number {
  const stages = getWorkflowStages(requesterRole);
  const maxIndex = stages.length - 1;

  // If final status, we're at the last stage
  if (status === "APPROVED" || status === "REJECTED" || status === "CANCELLED") {
    return maxIndex;
  }

  // Find all completed steps (APPROVED or FORWARDED)
  const completedSteps = approvals
    .filter((a) => a.step && (a.decision === "APPROVED" || a.decision === "FORWARDED"))
    .map((a) => a.step!)
    .sort((a, b) => b - a);

  if (completedSteps.length === 0) {
    // No approvals yet, submitted and waiting on HR Admin (step 1 = index 1)
    return 1;
  }

  const highestStep = completedSteps[0];

  // Check if the highest step was approved (final approval at any stage)
  const highestApproval = approvals.find((a) => a.step === highestStep);
  if (highestApproval?.decision === "APPROVED") {
    // Approved at this stage means we're done
    return maxIndex;
  }

  // If highest step was FORWARDED, the next step is current
  // Step corresponds to index in workflow (step 1 = index 1, step 2 = index 2, etc.)
  return Math.min(highestStep + 1, maxIndex);
}

/**
 * Get the next approver role based on current stage
 */
export function getNextApproverRole(currentIndex: number, requesterRole?: string): string | null {
  const stages = getWorkflowStages(requesterRole);
  if (currentIndex >= stages.length - 1) return null; // At last stage

  // Skip "Submitted" at index 0, roles start at index 1
  const roles = stages.slice(1); // ["HR Admin", "HR Head", "Dept Head"] or ["HR Admin", "HR Head", "CEO"]
  return roles[currentIndex] || null;
}

/**
 * Get the latest approval date for display
 */
export function getLatestApprovalDate(approvals: ApprovalRecord[]): string | null {
  const dates = approvals
    .filter((a) => a.decidedAt)
    .map((a) => a.decidedAt!)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  return dates.length > 0 ? dates[0] : null;
}

/**
 * Format date for display in header
 */
export function formatHeaderDate(date: string | null | undefined): string {
  if (!date) return "";
  return formatDate(date);
}
