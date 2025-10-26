import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/SectionHeader";

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
    <div className="space-y-4">
      <SectionHeader title="Leave Balance" />
      <div className="space-y-4">
        {balances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No balance information available.</p>
        ) : (
          balances.map((balance) => {
            const percentage = balance.total > 0 ? Math.min((balance.used / balance.total) * 100, 100) : 0;
            const tone = COLORS[balance.type as keyof typeof COLORS] ?? "bg-slate-400";
            return (
              <div key={balance.type} className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>{balance.type}</span>
                  <span>
                    {balance.used}/{balance.total} days used
                  </span>
                </div>
                <Progress className="mt-3 h-2" value={percentage} indicatorClassName={tone} />
                <p className="mt-2 text-xs text-muted-foreground">{balance.remaining} days remaining</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
