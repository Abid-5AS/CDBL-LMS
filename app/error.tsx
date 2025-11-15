"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full"></div>
            <div className="relative bg-destructive/10 dark:bg-destructive/20 p-8 rounded-full">
              <AlertTriangle className="w-20 h-20 text-destructive" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Something Went Wrong
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            We're sorry, but something unexpected happened. Our team has been notified and we're working on it.
          </p>

          {/* Error Details (for development) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                Error Details
              </summary>
              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                <code className="text-xs text-destructive break-all">
                  {error.message}
                </code>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={reset}
            size="lg"
            className="min-w-[160px]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-w-[160px]"
          >
            <a href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </a>
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground">
          If this problem persists, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
