import { Progress } from "@/components/ui/progress";

type LeaveBalanceCardProps = {
  balances: {
    type: string;
    used: number;
    total: number;
    remaining: number;
  }[];
};

const COLORS = {
  Casual: "bg-blue-500",
  Sick: "bg-amber-500",
  Earned: "bg-emerald-500",
};

export function LeaveBalanceCard({ balances }: LeaveBalanceCardProps) {
  return (
    <div className="rounded-lg border border-slate-200/50 dark:border-slate-800/50 glass-base p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Leave Balances</h3>
      <div className="mt-4 space-y-3">
        {balances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No balance information available.</p>
        ) : (
          balances.map((balance) => {
            const percentage = balance.total > 0 ? Math.min((balance.used / balance.total) * 100, 100) : 0;
            const tone = COLORS[balance.type as keyof typeof COLORS] ?? "bg-slate-400";
            return (
              <div key={balance.type}>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>{balance.type}</span>
                  <span className="text-slate-700">
                    {balance.used}/{balance.total} days
                  </span>
                </div>
                <Progress className="mt-2 h-2" value={percentage} indicatorClassName={tone} />
                <p className="mt-1 text-xs text-muted-foreground">{balance.remaining} days remaining</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
