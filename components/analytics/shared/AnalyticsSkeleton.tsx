"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/glass-card";

/**
 * ChartSkeleton - Loading state for chart components
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Skeleton
      className="w-full rounded-lg"
      style={{ height: `${height}px` }}
    />
  );
}

/**
 * AnalyticsCardSkeleton - Loading state for analytics cards
 */
export function AnalyticsCardSkeleton() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/4 mt-2" />
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

/**
 * TableSkeleton - Loading state for data tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

/**
 * MetricsSkeleton - Loading state for KPI metrics
 */
export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i}>
          <GlassCardContent className="pt-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </GlassCardContent>
        </GlassCard>
      ))}
    </div>
  );
}
