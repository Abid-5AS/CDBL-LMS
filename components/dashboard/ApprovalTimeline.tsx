"use client";

import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { APPROVAL_CHAIN } from "@/lib/workflow";
import clsx from "clsx";

type ApprovalRecord = {
  step?: number;
  approver?: string | { name: string | null } | null;
  decision: string;
  comment?: string | null;
  decidedAt?: string | null;
  toRole?: string | null;
};

type ApprovalStage = {
  role: string;
  roleLabel: string;
  action: "submitted" | "approved" | "rejected" | "forwarded" | "pending";
  date?: string;
  note?: string;
  approverName?: string;
};

const ROLE_LABELS: Record<string, string> = {
  HR_ADMIN: "HR Admin",
  DEPT_HEAD: "Dept Head",
  HR_HEAD: "HR Head",
  CEO: "CEO",
};

function formatRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role.replace(/_/g, " ");
}

function buildApprovalStages(
  approvals: ApprovalRecord[],
  createdAt?: string,
  status?: string
): ApprovalStage[] {
  const stages: ApprovalStage[] = [];

  // Always start with "Submitted" stage
  stages.push({
    role: "EMPLOYEE",
    roleLabel: "You",
    action: "submitted",
    date: createdAt,
    note: "Request sent to HR Admin",
  });

  // Create a map of step -> approval for quick lookup
  const approvalMap = new Map<number, ApprovalRecord>();
  approvals.forEach((approval) => {
    if (approval.step) {
      approvalMap.set(approval.step, approval);
    }
  });

  // Process each step in the approval chain
  APPROVAL_CHAIN.forEach((role, index) => {
    const step = index + 1; // Steps are 1-indexed
    const approval = approvalMap.get(step);

    if (approval) {
      // Approval record exists
      let action: ApprovalStage["action"];
      let note: string | undefined;

      if (approval.decision === "APPROVED") {
        action = "approved";
        note = approval.comment || `Approved by ${formatRoleLabel(role)}`;
      } else if (approval.decision === "REJECTED") {
        action = "rejected";
        note = approval.comment || `Rejected by ${formatRoleLabel(role)}`;
      } else if (approval.decision === "FORWARDED") {
        action = "forwarded";
        const nextRole = approval.toRole || APPROVAL_CHAIN[index + 1];
        note = nextRole
          ? `Forwarded to ${formatRoleLabel(nextRole)}`
          : approval.comment || "Forwarded";
      } else {
        action = "pending";
        note = `Awaiting review by ${formatRoleLabel(role)}`;
      }

      const approverName =
        typeof approval.approver === "string"
          ? approval.approver
          : approval.approver?.name || undefined;

      stages.push({
        role,
        roleLabel: formatRoleLabel(role),
        action,
        date: approval.decidedAt || undefined,
        note,
        approverName,
      });
    } else {
      // No approval record yet - check if it should be pending
      const hasAnyLaterApproval = APPROVAL_CHAIN.slice(index + 1).some(
        (laterRole) => {
          const laterStep = APPROVAL_CHAIN.indexOf(laterRole) + 1;
          return approvalMap.has(laterStep);
        }
      );

      // Find the highest completed step
      const completedSteps = Array.from(approvalMap.keys()).sort((a, b) => b - a);
      const highestStep = completedSteps.length > 0 ? completedSteps[0] : 0;

      // Show as pending if:
      // 1. There's a later approval (stage was skipped somehow), OR
      // 2. This step is the next one after the highest completed step, OR
      // 3. No approvals exist yet and this is the first step (HR_ADMIN), OR
      // 4. Status is not final (APPROVED/REJECTED/CANCELLED)
      const shouldShowAsPending =
        hasAnyLaterApproval ||
        step === highestStep + 1 ||
        (highestStep === 0 && step === 1) ||
        (status !== "APPROVED" &&
          status !== "REJECTED" &&
          status !== "CANCELLED" &&
          highestStep < step);

      if (shouldShowAsPending) {
        stages.push({
          role,
          roleLabel: formatRoleLabel(role),
          action: "pending",
          note: `Awaiting review by ${formatRoleLabel(role)}`,
        });
      }
    }
  });

  return stages;
}

function getStageIcon(action: ApprovalStage["action"]) {
  switch (action) {
    case "approved":
      return CheckCircle2;
    case "rejected":
      return XCircle;
    case "submitted":
    case "forwarded":
      return CheckCircle2;
    case "pending":
      return Clock;
    default:
      return Circle;
  }
}

function getStageColor(action: ApprovalStage["action"]) {
  switch (action) {
    case "approved":
    case "submitted":
      return {
        node: "bg-green-500 ring-green-200 dark:ring-green-900",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-300 dark:border-green-700",
      };
    case "rejected":
      return {
        node: "bg-red-500 ring-red-200 dark:ring-red-900",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-300 dark:border-red-700",
      };
    case "forwarded":
      return {
        node: "bg-blue-500 ring-blue-200 dark:ring-blue-900",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-300 dark:border-blue-700",
      };
    case "pending":
      return {
        node: "bg-amber-500 ring-amber-200 dark:ring-amber-900 animate-pulse",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-300 dark:border-amber-700",
      };
    default:
      return {
        node: "bg-gray-400 ring-gray-200 dark:ring-gray-800",
        text: "text-gray-600 dark:text-gray-400",
        border: "border-gray-300 dark:border-gray-700",
      };
  }
}

function getActionLabel(action: ApprovalStage["action"]): string {
  switch (action) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "forwarded":
      return "Forwarded";
    case "submitted":
      return "Submitted";
    case "pending":
      return "Pending";
    default:
      return "Unknown";
  }
}

function getFinalStatus(stages: ApprovalStage[], status?: string): string {
  if (status === "APPROVED") {
    return "Approved";
  }
  if (status === "REJECTED") {
    return "Rejected";
  }
  if (status === "CANCELLED") {
    return "Cancelled";
  }

  // Find the first pending stage
  const pendingStage = stages.find((s) => s.action === "pending");
  if (pendingStage) {
    return `Pending ${pendingStage.roleLabel} approval`;
  }

  // If all stages are complete but status is still pending, show generic
  return "Pending approval";
}

type ApprovalTimelineProps = {
  approvals: ApprovalRecord[];
  createdAt?: string;
  status?: string;
};

export function ApprovalTimeline({
  approvals,
  createdAt,
  status,
}: ApprovalTimelineProps) {
  const stages = buildApprovalStages(approvals, createdAt, status);
  const finalStatus = getFinalStatus(stages, status);

  return (
    <div className="space-y-6">
      <div className="relative">
        <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-6">
          {stages.map((stage, index) => {
            const Icon = getStageIcon(stage.action);
            const colors = getStageColor(stage.action);
            const isLast = index === stages.length - 1;

            return (
              <li key={`${stage.role}-${index}`} className="ml-6 relative">
                {/* Timeline node */}
                <span
                  className={clsx(
                    "absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-slate-900 transition-colors",
                    colors.node
                  )}
                  aria-label={`${stage.roleLabel} - ${getActionLabel(stage.action)}`}
                >
                  <Icon className="h-3.5 w-3.5 text-white" />
                </span>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={clsx(
                          "font-semibold text-sm",
                          colors.text
                        )}
                      >
                        {stage.roleLabel}
                        <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-400">
                          {stage.action === "approved"
                            ? "– Approved"
                            : stage.action === "rejected"
                            ? "– Rejected"
                            : stage.action === "forwarded"
                            ? "– Forwarded"
                            : stage.action === "submitted"
                            ? "– Submitted"
                            : "– Pending"}
                        </span>
                      </h3>
                      {stage.approverName && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          by {stage.approverName}
                        </p>
                      )}
                    </div>
                    {stage.date && (
                      <time className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
                        {formatDate(stage.date)}
                      </time>
                    )}
                  </div>
                  {stage.note && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {stage.note}
                    </p>
                  )}
                </div>

                {/* Connector line (except for last item) */}
                {!isLast && (
                  <div
                    className={clsx(
                      "absolute left-[-2px] top-6 w-0.5 h-6",
                      stage.action === "approved" || stage.action === "submitted"
                        ? "bg-green-300 dark:bg-green-700"
                        : stage.action === "rejected"
                        ? "bg-red-300 dark:bg-red-700"
                        : stage.action === "forwarded"
                        ? "bg-blue-300 dark:bg-blue-700"
                        : "bg-amber-300 dark:bg-amber-700"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Final Status: <span className="font-normal">{finalStatus}</span>
        </p>
      </div>
    </div>
  );
}
