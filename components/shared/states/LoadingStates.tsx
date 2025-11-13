/**
 * Shared loading state components
 * Consistent loading indicators across the application
 */

"use client";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Simple centered loading spinner
 */
type LoadingSpinnerProps = {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className || ""}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

/**
 * Loading card with spinner - for card-based layouts
 */
type LoadingCardProps = {
  message?: string;
  className?: string;
};

export function LoadingCard({ message = "Loading...", className }: LoadingCardProps) {
  return (
    <Card className={`rounded-2xl border-muted/60 shadow-sm ${className || ""}`}>
      <CardContent className="py-12">
        <LoadingSpinner message={message} />
      </CardContent>
    </Card>
  );
}

/**
 * Table loading skeleton - mimics table structure
 */
type TableLoadingSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export function TableLoadingSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableLoadingSkeletonProps) {
  return (
    <Card className={`rounded-2xl border-muted/60 shadow-sm ${className || ""}`}>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="border rounded-lg">
          <Skeleton className="h-64 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard loading skeleton - for dashboard layouts
 */
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inline loading state - for buttons and inline actions
 */
type InlineLoadingProps = {
  text?: string;
  size?: "sm" | "md";
};

export function InlineLoading({ text = "Loading", size = "sm" }: InlineLoadingProps) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <>
      <Loader2 className={`${sizeClass} mr-2 animate-spin`} />
      {text}
    </>
  );
}
