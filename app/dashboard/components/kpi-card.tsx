import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type KPICardProps = {
  title: string;
  value: string;
  subtext?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  // New enhanced props
  progress?: {
    used: number;
    total: number;
  };
  status?: "healthy" | "low" | "critical";
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
};

export function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor,
  progress,
  status,
  badge,
  badgeVariant = "default",
}: KPICardProps) {
  const progressPercentage = progress
    ? Math.min(Math.max((progress.used / progress.total) * 100, 0), 100)
    : undefined;

  const getProgressColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "bg-data-success";
      case "low":
        return "bg-data-warning";
      case "critical":
        return "bg-data-error";
      default:
        return "bg-data-info";
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
            {title}
            {badge && (
              <Badge variant={badgeVariant} className="text-xs">
                {badge}
              </Badge>
            )}
          </CardTitle>
        </div>
        {Icon ? <Icon size={18} className={iconColor ?? "text-muted-foreground"} /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
        {subtext ? <p className="text-xs text-muted-foreground mt-2">{subtext}</p> : null}
        {progress && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {progress.used} / {progress.total} days used
              </span>
              <span>{Math.round(progressPercentage ?? 0)}%</span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2"
              indicatorClassName={status ? getProgressColor(status) : undefined}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
