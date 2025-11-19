/**
 * Reusable Suspense wrapper with error boundary and loading states
 */

import { Suspense, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Default loading fallback
 */
export function DefaultSuspenseFallback({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8 rounded-2xl bg-card border border-border shadow-sm", className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Suspense wrapper with default loading state
 */
export function SuspenseWrapper({
  children,
  fallback,
  className,
}: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback || <DefaultSuspenseFallback className={className} />}>
      {children}
    </Suspense>
  );
}

/**
 * Card-style loading fallback for tables and lists
 */
export function CardSuspenseFallback() {
  return (
    <div className="space-y-4">
      <div className="h-64 rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-lg animate-pulse" />
    </div>
  );
}

/**
 * Form-style loading fallback
 */
export function FormSuspenseFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-muted/40 rounded-lg w-48" />
      <div className="h-4 bg-muted/40 rounded-lg w-64" />
      <div className="space-y-4">
        <div className="h-12 bg-muted/40 rounded-lg" />
        <div className="h-12 bg-muted/40 rounded-lg" />
        <div className="h-32 bg-muted/40 rounded-lg" />
      </div>
    </div>
  );
}
