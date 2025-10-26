import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Coins, UserCheck } from "lucide-react";

type HRStatCardsProps = {
  stats: {
    totalLeavesThisYear: number;
    avgApprovalTime: number;
    pendingRequests: number;
    employeesOnLeave: number;
    encashmentPending: number;
  };
};

const CARDS: Array<{
  key: keyof HRStatCardsProps["stats"];
  label: string;
  icon: typeof UserCheck;
  tone: string;
  suffix?: string;
}> = [
  {
    key: "employeesOnLeave" as const,
    label: "Employees on Leave",
    icon: UserCheck,
    tone: "text-blue-600",
  },
  {
    key: "pendingRequests" as const,
    label: "Pending Requests",
    icon: Clock,
    tone: "text-amber-600",
  },
  {
    key: "avgApprovalTime" as const,
    label: "Avg Approval Time (YTD)",
    icon: Calendar,
    tone: "text-emerald-600",
    suffix: " days",
  },
  {
    key: "encashmentPending" as const,
    label: "Encashment Pending",
    icon: Coins,
    tone: "text-purple-600",
  },
] as const;

export function HRStatCards({ stats }: HRStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key] ?? 0;
        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <Icon className={`h-5 w-5 ${card.tone}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">
                {value}
                {card.suffix ?? ""}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Leave Days (YTD)</CardTitle>
          <Calendar className="h-5 w-5 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-slate-900">{stats.totalLeavesThisYear ?? 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}
