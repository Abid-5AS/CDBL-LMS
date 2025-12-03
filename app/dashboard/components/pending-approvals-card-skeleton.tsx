export function PendingApprovalsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border dark:border-border/50 dark:border-border dark:border-border/50 bg-card p-6 shadow-sm animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-3"></div>
      <div className="h-8 w-16 bg-muted rounded"></div>
    </div>
  );
}