"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMetric {
  name: string;
  count: number;
  percentage?: number;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

interface TeamBreakdownWidgetProps {
  title?: string;
  metrics: TeamMetric[];
  isLoading?: boolean;
  variant?: "default" | "compact";
  showTrends?: boolean;
}

/**
 * Team Breakdown Widget
 *
 * Displays department or team-level metrics with visual breakdown
 * and optional trend indicators.
 */
export function TeamBreakdownWidget({
  title = "Team Breakdown",
  metrics,
  isLoading = false,
  variant = "default",
  showTrends = false,
}: TeamBreakdownWidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full max-w-[200px]" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const total = metrics.reduce((sum, m) => sum + m.count, 0);

  return (
    <Card className="animate-scale-in">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => {
            const percentage = metric.percentage || (total > 0 ? (metric.count / total) * 100 : 0);

            return (
              <div
                key={metric.name}
                className={cn(
                  "group relative rounded-lg border border-border/50 p-3 transition-all hover:border-border hover:shadow-sm",
                  variant === "compact" && "p-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold",
                      variant === "compact" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
                    )}>
                      {metric.count}
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium text-foreground",
                        variant === "compact" ? "text-sm" : "text-base"
                      )}>
                        {metric.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>

                  {showTrends && metric.trend && (
                    <div className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                      metric.trend.direction === "up"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {metric.trend.direction === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(metric.trend.value)}%
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {metrics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No team data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
