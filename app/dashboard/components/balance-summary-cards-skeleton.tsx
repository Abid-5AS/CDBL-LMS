export function BalanceSummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className="rounded-xl border border-border-strong dark:border-border-strong bg-card p-6 shadow-sm animate-pulse"
        >
          <div className="h-4 w-24 bg-muted rounded mb-2"></div>
          <div className="h-8 w-16 bg-muted rounded mb-2"></div>
          <div className="h-3 w-32 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  );
}