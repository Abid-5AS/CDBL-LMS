/**
 * useErrorRecovery Hook
 *
 * Hook for managing error recovery with automatic retry suggestions
 * and error context tracking.
 */

import { useCallback, useState } from "react";
import { getErrorMessage, getErrorType, ErrorType } from "@/constants/errors";

interface ErrorRecoveryState {
  /** The error that occurred */
  error: Error | null;

  /** Whether recovery is in progress */
  isRecovering: boolean;

  /** Number of recovery attempts made */
  recoveryAttempts: number;

  /** Whether error is recoverable */
  isRecoverable: boolean;

  /** Suggested recovery action */
  suggestedAction: "retry" | "reload" | "reset" | "contact-support" | null;
}

interface ErrorRecoveryActions {
  /** Set an error */
  setError: (error: Error | null) => void;

  /** Try to recover from error */
  recover: (action: "retry" | "reload" | "reset") => Promise<void>;

  /** Clear error and reset state */
  reset: () => void;

  /** Get user-friendly error message */
  getErrorMessage: (fallback?: string) => string;

  /** Get error type */
  getErrorType: () => ErrorType;
}

/**
 * Determine if error is recoverable
 * @param error - Error to check
 * @returns true if error is recoverable
 */
function isErrorRecoverable(error: unknown): boolean {
  const errorType = getErrorType(error);

  // These errors are not recoverable without user action
  const unrecoverableErrors = [
    ErrorType.UNAUTHORIZED,
    ErrorType.FORBIDDEN,
    ErrorType.NOT_FOUND,
    ErrorType.VALIDATION,
  ];

  return !unrecoverableErrors.includes(errorType);
}

/**
 * Suggest recovery action for error type
 * @param error - Error to analyze
 * @returns Suggested action
 */
function suggestRecoveryAction(error: unknown): "retry" | "reload" | "reset" | "contact-support" | null {
  const errorType = getErrorType(error);

  switch (errorType) {
    case ErrorType.NETWORK:
    case ErrorType.TIMEOUT:
    case ErrorType.SERVER:
    case ErrorType.RATE_LIMIT:
      // Network and server errors should be retried
      return "retry";

    case ErrorType.UNAUTHORIZED:
      // Unauthorized errors suggest reload (logout and re-login)
      return "reload";

    case ErrorType.FORBIDDEN:
    case ErrorType.NOT_FOUND:
      // These are permanent, suggest contacting support
      return "contact-support";

    case ErrorType.CLIENT:
    case ErrorType.VALIDATION:
      // Client errors suggest reset of current action
      return "reset";

    default:
      // Unknown errors suggest contact support
      return "contact-support";
  }
}

/**
 * Hook for managing error recovery workflows
 *
 * Provides utilities for:
 * - Tracking errors and recovery attempts
 * - Suggesting recovery actions
 * - Resetting error state
 *
 * @param maxRecoveryAttempts - Maximum recovery attempts (default: 3)
 * @returns Error state and recovery actions
 *
 * @example
 * ```typescript
 * const { error, recover, reset, getErrorMessage } = useErrorRecovery();
 *
 * useEffect(() => {
 *   if (error) {
 *     console.error(getErrorMessage());
 *     // User can call recover('retry') to attempt recovery
 *   }
 * }, [error]);
 * ```
 */
export function useErrorRecovery(
  maxRecoveryAttempts: number = 3
): ErrorRecoveryState & ErrorRecoveryActions {
  const [error, setErrorState] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  const isRecoverable = error ? isErrorRecoverable(error) : false;
  const suggestedAction = error ? suggestRecoveryAction(error) : null;

  const setError = useCallback((newError: Error | null) => {
    setErrorState(newError);
    if (newError) {
      setRecoveryAttempts(0);
    }
  }, []);

  const recover = useCallback(
    async (action: "retry" | "reload" | "reset") => {
      if (recoveryAttempts >= maxRecoveryAttempts) {
        console.warn("Max recovery attempts reached");
        return;
      }

      setIsRecovering(true);
      setRecoveryAttempts(prev => prev + 1);

      try {
        switch (action) {
          case "retry":
            // Retry is handled by caller through retry callback
            // We just track the attempt
            break;

          case "reload":
            // Reload the page
            window.location.reload();
            break;

          case "reset":
            // Clear error state
            setErrorState(null);
            break;
        }
      } finally {
        setIsRecovering(false);
      }
    },
    [recoveryAttempts, maxRecoveryAttempts]
  );

  const reset = useCallback(() => {
    setErrorState(null);
    setIsRecovering(false);
    setRecoveryAttempts(0);
  }, []);

  const getErrorMessageCallback = useCallback(
    (fallback?: string) => {
      return error ? getErrorMessage(error, fallback) : (fallback || "An error occurred");
    },
    [error]
  );

  const getErrorTypeCallback = useCallback(() => {
    return getErrorType(error);
  }, [error]);

  return {
    error,
    isRecovering,
    recoveryAttempts,
    isRecoverable,
    suggestedAction,
    setError,
    recover,
    reset,
    getErrorMessage: getErrorMessageCallback,
    getErrorType: getErrorTypeCallback,
  };
}
