import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Shared loading fallback component for dashboard pages
 */
export function DashboardLoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="h-36 rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm animate-pulse" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-border-strong bg-bg-primary shadow-sm animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/**
 * Simple loading skeleton for dashboard cards
 */
export function DashboardCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for table/list views
 */
export function DashboardTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}






