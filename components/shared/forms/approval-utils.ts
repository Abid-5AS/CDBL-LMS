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
// Helper to get role label
function getRoleLabel(role?: string) {
  if (!role) return "Approver";
  const map: Record<string, string> = {
    EMPLOYEE: "Employee",
    DEPT_HEAD: "Dept Head",
    HR_ADMIN: "HR Admin",
    HR_HEAD: "HR Head",
    CEO: "CEO",
    SYSTEM_ADMIN: "System Admin"
  };
  return map[role] || role.replace(/_/g, " ");
}

export function getStagesFromApprovals(approvals: ApprovalRecord[], requesterRole?: string): string[] {
  // Always start with "Submitted"
  const stages: string[] = ["Submitted"];

  // If no approvals, just show Submitted (waiting for first step)
  if (!approvals || approvals.length === 0) {
    return stages;
  }

  // Sort by step
  const sorted = [...approvals].sort((a, b) => (a.step || 0) - (b.step || 0));

  // Build stages from actual approvals
  for (const approval of sorted) {
    let roleLabel = "Approver";

    // Try to get role from approver object
    if (typeof approval.approver === "object" && approval.approver?.role) {
      roleLabel = getRoleLabel(approval.approver.role);
    } else if (typeof approval.approver === "string") {
      // If approver is a string (name), we can't infer role, use generic
      roleLabel = approval.approver;
    }

    stages.push(roleLabel);
  }

  return stages;
}

/**
 * @deprecated This function is deprecated and should not be used.
 * Workflow stages are now dynamically derived from actual approval records.
 * Use getStagesFromApprovals instead.
 */
export function getWorkflowStages(requesterRole?: string): string[] {
  // Return minimal fallback - only "Submitted"
  // The real stages should come from getStagesFromApprovals
  console.warn("getWorkflowStages is deprecated. Use getStagesFromApprovals with actual approval data.");
  return ["Submitted"];
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
  const stages = getStagesFromApprovals(approvals, requesterRole);
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
export function getNextApproverRole(currentIndex: number, requesterRole?: string, approvals?: ApprovalRecord[]): string | null {
  const stages = getStagesFromApprovals(approvals || [], requesterRole);
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
