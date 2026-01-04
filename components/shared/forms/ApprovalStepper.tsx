"use client";

import { CheckCircle2, Circle } from "lucide-react";
import clsx from "clsx";

import { getWorkflowStages } from "./approval-utils";

type Stage = string; // Relaxed type since stages are dynamic strings now

type ApprovalStepperProps = {
  stages?: Stage[];
  currentIndex: number;
  className?: string;
  requesterRole?: string;
};

export function ApprovalStepper({
  stages,
  currentIndex,
  className,
  requesterRole,
}: ApprovalStepperProps) {
  // Use provided stages or determine from requester role
  const displayStages = stages || getWorkflowStages(requesterRole);

  return (
    <div className={clsx("w-full", className)}>
      <ol
        className="flex items-center justify-between gap-2"
        role="list"
        aria-label="Approval progress"
      >
        {displayStages.map((label, i) => {
          const isCurrent = i === currentIndex;

          return (
            <li
              key={label}
              className="flex-1 flex flex-col items-center text-xs"
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Progress bar segment */}
              <div
                className={clsx(
                  "h-1.5 w-full rounded-full transition-colors",
                  i < currentIndex
                    ? "bg-success dark:bg-success/80 dark:bg-success dark:bg-success/80"
                    : i === currentIndex
                      ? "bg-warning dark:bg-warning/80 dark:bg-warning dark:bg-warning/80"
                      : "bg-muted dark:bg-muted/80 dark:bg-muted dark:bg-muted/80"
                )}
                aria-hidden="true"
              />

              {/* Stage indicator */}
              <div className="mt-2 flex items-center gap-1.5">
                {i < currentIndex ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success dark:text-success/90 dark:text-success dark:text-success/90 shrink-0" />
                ) : i === currentIndex ? (
                  <div className="relative shrink-0">
                    <div className="h-3.5 w-3.5 rounded-full bg-warning dark:bg-warning/80 dark:bg-warning dark:bg-warning/80 animate-pulse" />
                    <div className="absolute inset-0 h-3.5 w-3.5 rounded-full border-2 border-warning dark:border-warning animate-ping opacity-75" />
                  </div>
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground dark:text-muted-foreground/80 dark:text-muted-foreground dark:text-muted-foreground/80 shrink-0" strokeWidth={2} />
                )}
                <span
                  className={clsx(
                    "text-[10px] leading-tight",
                    i === currentIndex
                      ? "font-semibold text-muted-foreground dark:text-muted-foreground/80 dark:text-muted-foreground dark:text-muted-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Progress indicator */}
      <div className="mt-1.5 text-center">
        <span className="text-[10px] text-muted-foreground">
          Step {currentIndex + 1} of {displayStages.length}
        </span>
      </div>
    </div>
  );
}
