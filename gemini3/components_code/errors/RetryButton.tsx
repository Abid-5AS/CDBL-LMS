/**
 * RetryButton Component
 *
 * Reusable retry button with loading state and attempt tracking
 */

"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ComponentPropsWithoutRef } from "react";

interface RetryButtonProps extends Omit<ComponentPropsWithoutRef<typeof Button>, "onClick"> {
  /** Function to call on retry */
  onRetry: () => void | Promise<void>;

  /** Show attempt count */
  showAttempts?: boolean;

  /** Max attempts before disabling (0 = unlimited) */
  maxAttempts?: number;

  /** Reset attempts after delay (ms, 0 = no reset) */
  resetAfter?: number;

  /** Custom label */
  label?: string;
}

/**
 * RetryButton - Button for retrying failed operations
 *
 * Handles loading state, attempt tracking, and error catching.
 * Automatically disables after max attempts (if configured).
 *
 * @example
 * ```tsx
 * // Basic retry
 * <RetryButton
 *   onRetry={async () => {
 *     await refetch();
 *   }}
 * />
 *
 * // With attempt limiting
 * <RetryButton
 *   onRetry={handleRetry}
 *   showAttempts
 *   maxAttempts={3}
 *   label="Retry load"
 * />
 * ```
 */
export function RetryButton({
  onRetry,
  showAttempts = false,
  maxAttempts = 0,
  resetAfter = 0,
  label = "Retry",
  className,
  disabled,
  ...props
}: RetryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const isDisabled = disabled || (maxAttempts > 0 && attempts >= maxAttempts);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setAttempts(prev => prev + 1);
      await onRetry();
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAttempts(0);
  };

  // Auto-reset attempts after delay
  useEffect(() => {
    if (resetAfter === 0 || attempts === 0) return;

    const timer = setTimeout(handleReset, resetAfter);
    return () => clearTimeout(timer);
  }, [attempts, resetAfter]);

  const displayLabel = showAttempts
    ? `${label} (${attempts}${maxAttempts > 0 ? `/${maxAttempts}` : ""})`
    : label;

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      className={cn("gap-2", className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="h-4 w-4" />
      )}
      {displayLabel}
    </Button>
  );
}
