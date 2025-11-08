"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches React errors and displays fallback UI
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to error tracking service (Sentry, etc.)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="border border-destructive rounded-xl p-6 bg-card">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-destructive font-semibold">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              An error occurred while rendering this component. Please try
              refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="rounded-md bg-muted p-3 text-xs">
                <summary className="cursor-pointer font-medium">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto text-xs">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                Try again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                Refresh page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Ensure we return children as-is without any React.Children manipulation
    return <>{this.props.children}</>;
  }
}

/**
 * DashboardErrorBoundary - Specialized error boundary for dashboard pages
 * Provides role-specific error messages
 */
export function DashboardErrorBoundary({
  children,
  role,
}: {
  children: ReactNode;
  role?: string;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log dashboard-specific errors
        console.error(`Dashboard error (${role}):`, error, errorInfo);
      }}
      fallback={
        <div className="border border-destructive rounded-xl p-6 bg-card">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-destructive font-semibold">
              <AlertTriangle className="h-5 w-5" />
              Dashboard Error
            </h3>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load the {role ? `${role} ` : ""}dashboard. Please
              refresh the page or contact support if the problem persists.
            </p>
            <Button onClick={() => window.location.reload()} variant="default">
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
