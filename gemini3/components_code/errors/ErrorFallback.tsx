/**
 * ErrorFallback Component
 *
 * Default error display UI for ErrorBoundary
 * Provides user-friendly error message and recovery actions
 */

"use client";

import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/constants/errors";

interface ErrorFallbackProps {
  /** The error that occurred */
  error: Error;

  /** Callback to reset error state */
  onReset: () => void;

  /** Error boundary level: "page" | "section" | "card" */
  level?: "page" | "section" | "card";

  /** Show error details in development */
  isDevelopment?: boolean;

  /** Custom error message */
  customMessage?: string;
}

/**
 * ErrorFallback - Default error UI for ErrorBoundary
 *
 * Displays different UI based on error boundary level:
 * - "page": Full-screen error with navigation options
 * - "section": Inline error with retry button
 * - "card": Compact error card
 *
 * @example
 * ```tsx
 * <ErrorFallback
 *   error={error}
 *   onReset={handleReset}
 *   level="section"
 * />
 * ```
 */
export function ErrorFallback({
  error,
  onReset,
  level = "page",
  isDevelopment = process.env.NODE_ENV === "development",
  customMessage,
}: ErrorFallbackProps) {
  const userMessage = customMessage || getErrorMessage(error);

  if (level === "card") {
    return <ErrorCard error={error} onReset={onReset} />;
  }

  if (level === "section") {
    return <ErrorSection error={error} onReset={onReset} />;
  }

  // Default: page-level error
  return (
    <ErrorPage error={error} onReset={onReset} isDevelopment={isDevelopment} />
  );
}

/**
 * ErrorPage - Full-screen error display
 */
function ErrorPage({
  error,
  onReset,
  isDevelopment,
}: {
  error: Error;
  onReset: () => void;
  isDevelopment: boolean;
}) {
  const userMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 p-6 border border-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.15)]">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-3 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Something went wrong
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {userMessage}
          </p>
        </div>

        {/* Development error details */}
        {isDevelopment && (
          <details className="neo-card rounded-xl border-red-500/30 bg-red-500/5 p-4">
            <summary className="cursor-pointer font-mono text-xs font-semibold text-red-600 dark:text-red-400">
              Error details (Development)
            </summary>
            <pre className="mt-3 overflow-auto rounded-lg bg-[var(--color-card-elevated)] p-3 text-xs border border-[var(--shell-card-border)]">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onReset}
            className="flex-1 neo-button rounded-xl bg-gradient-to-r from-[rgb(91,94,252)] to-[rgb(71,74,232)] hover:shadow-[0_4px_16px_rgba(91,94,252,0.4)] transition-all duration-200"
            variant="default"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            className="flex-1 neo-button rounded-xl border-[var(--shell-card-border)] hover:border-[rgb(91,94,252)]/50 hover:bg-[rgba(91,94,252,0.05)] transition-all duration-200"
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </div>

        {/* Support message */}
        <p className="text-xs text-[var(--color-text-secondary)] text-center">
          If the problem persists, please{" "}
          <a
            href="mailto:support@example.com"
            className="underline hover:text-[rgb(91,94,252)] transition-colors"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * ErrorSection - Inline error for section-level boundaries
 */
function ErrorSection({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  const userMessage = getErrorMessage(error);

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 neo-card">
      <div className="flex gap-3.5">
        <div className="rounded-lg bg-red-500/10 p-2 h-fit">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        </div>

        <div className="flex-1 space-y-2.5">
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            Failed to load
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {userMessage}
          </p>

          <Button
            onClick={onReset}
            size="sm"
            variant="outline"
            className="mt-3 neo-button rounded-lg border-[var(--shell-card-border)] hover:border-[rgb(91,94,252)]/50 hover:bg-[rgba(91,94,252,0.05)] transition-all duration-200"
          >
            <RotateCcw className="mr-2 h-3 w-3" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * ErrorCard - Compact error for card-level boundaries
 */
function ErrorCard({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div
      className={cn(
        "neo-card rounded-xl p-5",
        "border border-red-500/20 bg-red-500/5 shadow-[var(--shadow-1)]"
      )}
    >
      <div className="flex gap-3">
        <div className="rounded-lg bg-red-500/10 p-2 h-fit">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Error loading content
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {getErrorMessage(error)}
          </p>

          <Button
            onClick={onReset}
            size="sm"
            variant="ghost"
            className="h-8 text-xs mt-2 rounded-lg hover:bg-[rgba(91,94,252,0.05)] hover:text-[rgb(91,94,252)] transition-all duration-200"
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
