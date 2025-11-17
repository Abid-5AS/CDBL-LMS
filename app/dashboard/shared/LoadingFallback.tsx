import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Shared loading fallback component for dashboard pages with enhanced shimmer effect
 */
export function DashboardLoadingFallback() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative h-36 rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 shimmer-effect" />
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="relative h-32 rounded-xl border border-border-strong bg-bg-primary shadow-sm overflow-hidden"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute inset-0 shimmer-effect" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Enhanced loading skeleton for dashboard cards with shimmer effect
 */
export function DashboardCardSkeleton() {
  return (
    <Card className="relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute inset-0 shimmer-effect" />
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Enhanced loading skeleton for table/list views with staggered animation
 */
export function DashboardTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="relative h-16 w-full rounded-lg border border-border bg-card overflow-hidden"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="absolute inset-0 shimmer-effect" />
          <div className="flex items-center gap-4 p-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for KPI cards with proper structure
 */
export function KPICardSkeleton() {
  return (
    <div className="neo-card relative flex h-full min-h-[190px] flex-col px-5 py-5 sm:px-6 sm:py-6 overflow-hidden">
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






