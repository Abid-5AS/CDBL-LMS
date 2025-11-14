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
  return <ErrorPage error={error} onReset={onReset} isDevelopment={isDevelopment} />;
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            {userMessage}
          </p>
        </div>

        {/* Development error details */}
        {isDevelopment && (
          <details className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <summary className="cursor-pointer font-mono text-xs font-semibold text-destructive">
              Error details (Development)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-background p-2 text-xs">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onReset}
            className="flex-1"
            variant="default"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = "/"}
            className="flex-1"
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </div>

        {/* Support message */}
        <p className="text-xs text-muted-foreground text-center">
          If the problem persists, please{" "}
          <a
            href="mailto:support@example.com"
            className="underline hover:text-foreground"
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
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />

        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-foreground">Failed to load</h3>
          <p className="text-sm text-muted-foreground">
            {userMessage}
          </p>

          <Button
            onClick={onReset}
            size="sm"
            variant="outline"
            className="mt-2"
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
function ErrorCard({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  return (
    <div className={cn(
      "glass-card rounded-2xl p-6",
      "border border-destructive/20 bg-destructive/5"
    )}>
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />

        <div className="flex-1 space-y-2 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Error loading content
          </p>
          <p className="text-xs text-muted-foreground">
            {getErrorMessage(error)}
          </p>

          <Button
            onClick={onReset}
            size="sm"
            variant="ghost"
            className="h-7 text-xs mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
