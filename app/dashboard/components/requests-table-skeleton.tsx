export function RequestsTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border-b border-border/50">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-3 w-32 bg-muted rounded"></div>
            </div>
            <div className="h-4 w-16 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}