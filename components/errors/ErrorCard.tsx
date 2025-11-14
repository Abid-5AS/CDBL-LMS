/**
 * ErrorCard Component
 *
 * Reusable error display card for showing errors within dashboard content
 * Provides consistent styling and recovery actions
 */

"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/constants/errors";

interface ErrorCardProps {
  /** Error to display */
  error: Error | null;

  /** Custom error message (overrides automatic message) */
  message?: string;

  /** Callback when retry button is clicked */
  onRetry?: () => void | Promise<void>;

  /** Show retry button */
  showRetry?: boolean;

  /** Custom className */
  className?: string;

  /** Error level for styling */
  level?: "warning" | "error" | "critical";
}

const levelStyles = {
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
    icon: "text-yellow-600 dark:text-yellow-400",
    text: "text-yellow-900 dark:text-yellow-100",
    button: "hover:bg-yellow-100 dark:hover:bg-yellow-800/40",
  },
  error: {
    bg: "bg-destructive/5 border-destructive/20",
    icon: "text-destructive",
    text: "text-destructive",
    button: "hover:bg-destructive/10",
  },
  critical: {
    bg: "bg-destructive/10 border-destructive/30",
    icon: "text-destructive",
    text: "text-destructive",
    button: "hover:bg-destructive/20",
  },
};

/**
 * ErrorCard - Displays error with recovery options
 *
 * Flexible error display component that can be used within any content area.
 * Supports custom messages, retry actions, and different severity levels.
 *
 * @example
 * ```tsx
 * // Basic error display
 * <ErrorCard error={error} />
 *
 * // With retry action
 * <ErrorCard
 *   error={error}
 *   onRetry={async () => {
 *     await refetch();
 *   }}
 *   showRetry
 * />
 *
 * // Custom message
 * <ErrorCard
 *   error={error}
 *   message="Failed to load dashboard data. Please try again."
 *   onRetry={handleRetry}
 *   level="critical"
 * />
 * ```
 */
export function ErrorCard({
  error,
  message,
  onRetry,
  showRetry = true,
  className,
  level = "error",
}: ErrorCardProps) {
  if (!error) return null;

  const style = levelStyles[level];
  const displayMessage = message || getErrorMessage(error);

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6",
        "border flex gap-4",
        style.bg,
        className
      )}
      role="alert"
    >
      {/* Icon */}
      <AlertCircle className={cn("h-6 w-6 flex-shrink-0 mt-0.5", style.icon)} />

      {/* Content */}
      <div className="flex-1 space-y-3 min-w-0">
        <div>
          <h3 className={cn("font-semibold text-sm", style.text)}>
            Error loading content
          </h3>
          <p className={cn("text-sm mt-1 opacity-85", style.text)}>
            {displayMessage}
          </p>
        </div>

        {/* Retry button */}
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className={cn("mt-2", style.button)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
