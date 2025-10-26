import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Coins, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type HRStatCardsProps = {
  stats: {
    employeesOnLeave: number;
    pendingRequests: number;
    avgApprovalTime: number;
    encashmentPending: number;
    totalLeavesThisYear: number;
  };
  className?: string;
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

export function HRStatCards({ stats, className }: HRStatCardsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key] ?? 0;
        return (
          <Card key={card.key} className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                {card.label}
              </CardTitle>
              <Icon className={cn("h-5 w-5", card.tone)} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">
                {value}
                {card.suffix ?? ""}
              </p>
            </CardContent>
          </Card>
        );
      })}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">
            Total Leave Days (YTD)
          </CardTitle>
          <Calendar className="h-5 w-5 text-slate-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-blue-600">{stats.totalLeavesThisYear ?? 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}
