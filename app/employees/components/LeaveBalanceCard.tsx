import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Leave Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {balances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No balance information available.</p>
        ) : (
          balances.map((balance) => {
            const percentage = balance.total > 0 ? Math.min((balance.used / balance.total) * 100, 100) : 0;
            return (
              <div key={balance.type}>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{balance.type}</span>
                  <span>
                    {balance.used}/{balance.total} days used
                  </span>
                </div>
                <Progress className="mt-2" value={percentage} indicatorClassName={COLORS[balance.type as keyof typeof COLORS]} />
                <p className="mt-1 text-xs text-muted-foreground">{balance.remaining} days remaining</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
