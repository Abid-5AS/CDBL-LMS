export function PolicyRemindersSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-1/4 bg-muted rounded mb-4"></div>
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-2 border-b border-border/50 last:border-0">
            <div className="h-3 w-full bg-muted rounded mb-1"></div>
            <div className="h-3 w-3/4 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}