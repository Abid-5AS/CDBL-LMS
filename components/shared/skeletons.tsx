"use client";

import { cn } from "@/lib/utils";
import { ResponsiveDashboardGrid } from "@/components/dashboards/shared/ResponsiveDashboardGrid";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="surface-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="neo-card relative flex h-full min-h-[190px] flex-col px-5 py-5 sm:px-6 sm:py-6 overflow-hidden animate-fade-in">
      <div className="absolute inset-0 shimmer-effect" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

function KPIGridSkeleton({
  cards = 3,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <ResponsiveDashboardGrid
      columns={`1:1:${cards}:${cards}`}
      gap="md"
      className={className}
    >
      {[...Array(cards)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </ResponsiveDashboardGrid>
  );
}

function DashboardCardSkeleton() {
  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  KPICardSkeleton,
  KPIGridSkeleton,
  DashboardCardSkeleton,
};
