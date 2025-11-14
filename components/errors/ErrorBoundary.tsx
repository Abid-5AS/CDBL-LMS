/**
 * ErrorBoundary Component
 *
 * React error boundary that catches rendering errors and displays fallback UI
 * Supports error logging and recovery actions
 */

import React, { ErrorInfo, ReactNode } from "react";
import { formatErrorForLogging } from "@/constants/errors";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
  /** Child components */
  children: ReactNode;

  /** Custom fallback component */
  fallback?: (error: Error, reset: () => void) => ReactNode;

  /** Called when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Error boundary level: "page" | "section" | "card" */
  level?: "page" | "section" | "card";

  /** Show error details in development mode */
  isDevelopment?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches React rendering errors
 *
 * Provides fallback UI and error recovery options when child components throw.
 * Must be used as a class component (React limitation).
 *
 * @example
 * ```tsx
 * // Wrap page
 * <ErrorBoundary level="page">
 *   <Dashboard />
 * </ErrorBoundary>
 *
 * // Wrap section with custom fallback
 * <ErrorBoundary
 *   level="section"
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 * >
 *   <DataSection />
 * </ErrorBoundary>
 *
 * // With error logging
 * <ErrorBoundary
 *   onError={(error, errorInfo) => {
 *     console.error("Error caught:", error, errorInfo);
 *     // Send to error tracking service
 *   }}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, isDevelopment } = this.props;

    // Log error
    if (isDevelopment !== false) {
      console.error(
        formatErrorForLogging(error, {
          componentStack: errorInfo.componentStack,
        })
      );
    }

    // Call custom error handler
    onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, level = "page", isDevelopment } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Use default fallback
      return (
        <ErrorFallback
          error={error}
          onReset={this.resetError}
          level={level}
          isDevelopment={isDevelopment}
        />
      );
    }

    return children;
  }
}

/**
 * withErrorBoundary HOC
 *
 * Higher-order component that wraps a component with ErrorBoundary
 *
 * @example
 * ```tsx
 * const ProtectedDashboard = withErrorBoundary(Dashboard, {
 *   level: "page",
 *   fallback: (error) => <CustomErrorUI error={error} />
 * });
 *
 * // Use it normally
 * <ProtectedDashboard />
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">
) {
  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...options}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }

  WithErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;

  return WithErrorBoundary;
}
