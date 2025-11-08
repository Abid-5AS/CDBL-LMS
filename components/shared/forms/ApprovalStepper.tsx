"use client";

import { CheckCircle2, Circle } from "lucide-react";
import clsx from "clsx";

type Stage = "Submitted" | "HR Admin" | "Dept Head" | "HR Head" | "CEO";

type ApprovalStepperProps = {
  stages?: Stage[];
  currentIndex: number;
  className?: string;
};

export function ApprovalStepper({
  stages = ["Submitted", "HR Admin", "Dept Head", "HR Head", "CEO"],
  currentIndex,
  className,
}: ApprovalStepperProps) {

  return (
    <div className={clsx("w-full", className)}>
      <ol
        className="flex items-center justify-between gap-2"
        role="list"
        aria-label="Approval progress"
      >
        {stages.map((label, i) => {
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
                    ? "bg-data-success dark:bg-data-success"
                    : i === currentIndex
                    ? "bg-data-warning dark:bg-data-warning"
                    : "bg-bg-secondary dark:bg-bg-secondary"
                )}
                aria-hidden="true"
              />

              {/* Stage indicator */}
              <div className="mt-2 flex items-center gap-1.5">
                {i < currentIndex ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-data-success dark:text-data-success shrink-0" />
                ) : i === currentIndex ? (
                  <div className="relative shrink-0">
                    <div className="h-3.5 w-3.5 rounded-full bg-data-warning dark:bg-data-warning animate-pulse" />
                    <div className="absolute inset-0 h-3.5 w-3.5 rounded-full border-2 border-data-warning dark:border-data-warning animate-ping opacity-75" />
                  </div>
                ) : (
                  <Circle className="h-3.5 w-3.5 text-text-secondary dark:text-text-secondary shrink-0" strokeWidth={2} />
                )}
                <span
                  className={clsx(
                    "text-[10px] leading-tight",
                    i === currentIndex
                      ? "font-semibold text-text-secondary dark:text-text-secondary"
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
          Step {currentIndex + 1} of {stages.length}
        </span>
      </div>
    </div>
  );
}
