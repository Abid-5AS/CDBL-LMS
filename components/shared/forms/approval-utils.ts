import { APPROVAL_CHAIN } from "@/lib/workflow";
import { formatDate } from "@/lib/utils";

type ApprovalRecord = {
  step?: number;
  approver?: string | { name: string | null } | null;
  decision: string;
  comment?: string | null;
  decidedAt?: string | null;
  toRole?: string | null;
};

/**
 * Calculate the current stage index for the approval stepper
 * Returns 0-4: 0=Submitted, 1=HR Admin, 2=Dept Head, 3=HR Head, 4=CEO
 */
export function calculateCurrentStageIndex(
  approvals: ApprovalRecord[],
  status?: string
): number {
  // If final status, we're at the last stage (CEO = index 4)
  if (status === "APPROVED" || status === "REJECTED" || status === "CANCELLED") {
    return 4;
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
    // Approved at this stage means we're done (all approvals complete)
    return 4;
  }

  // If highest step was FORWARDED, the next step is current
  // Step 1 (HR Admin) -> index 2 (Dept Head)
  // Step 2 (Dept Head) -> index 3 (HR Head)
  // Step 3 (HR Head) -> index 4 (CEO)
  return Math.min(highestStep + 1, 4);
}

/**
 * Get the next approver role based on current stage
 */
export function getNextApproverRole(currentIndex: number): string | null {
  if (currentIndex >= 4) return null; // At CEO or beyond
  
  const roles = ["HR Admin", "Dept Head", "HR Head", "CEO"];
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
