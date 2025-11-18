export function PendingApprovalsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 border-b border-border/50 last:border-0">
            <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}