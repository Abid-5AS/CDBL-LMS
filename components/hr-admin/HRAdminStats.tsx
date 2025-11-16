"use client";

// UI Components (barrel export)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

// Local types
import { HRApprovalItem } from "./types";

type HRAdminStatsProps = {
  items: HRApprovalItem[];
  loading?: boolean;
};

const PLACEHOLDER_ENCASHMENT = 0;

export function HRAdminStats({ items, loading }: HRAdminStatsProps) {
  const pendingRequests = items.length;
  const employeesOnLeave = new Set(
    items.map((item) => item.requestedByEmail ?? item.requestedByName ?? "")
  ).size;
  const avgApprovalTime =
    items.length > 0
      ? `${(
          items.reduce((acc, item) => acc + item.requestedDays, 0) /
          items.length
        ).toFixed(1)} days`
      : "—";

  const cards = [
    { title: "Employees on Leave", value: employeesOnLeave },
    { title: "Pending Requests", value: pendingRequests },
    { title: "Avg Approval Time (YTD)", value: avgApprovalTime },
    { title: "Encashment Requests Pending", value: PLACEHOLDER_ENCASHMENT },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="rounded-2xl border border-border bg-card/90 shadow-sm"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
