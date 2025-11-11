"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Button,
} from "@/components/ui";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { cn } from "@/lib/utils";


interface Insight {
  kind: string;
  text: string;
  meta?: Record<string, any>;
}

function getSeverityConfig(kind: string) {
  if (
    kind.includes("WARNING") ||
    kind.includes("LAPSE") ||
    kind.includes("RISK")
  ) {
    return {
      icon: AlertTriangle,
      color: "text-data-warning dark:text-data-warning",
      bg: "bg-data-warning dark:bg-data-warning/30",
      border: "border-data-warning dark:border-data-warning",
    };
  }
  if (kind.includes("ERROR") || kind.includes("ACTION")) {
    return {
      icon: XCircle,
      color: "text-data-error dark:text-data-error",
      bg: "bg-data-error dark:bg-data-error/30",
      border: "border-data-error dark:border-data-error",
    };
  }
  return {
    icon: Info,
    color: "text-data-info dark:text-data-info",
    bg: "bg-data-info dark:bg-data-info/30",
    border: "border-data-info dark:border-data-info",
  };
}

export function InsightsWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data, isLoading, error } = useSWR<{ insights: Insight[] }>(
    "/api/dashboard/insights",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  if (isLoading) {
    return (
      <Card className="solid-card animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="size-4" />
            Insights & Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || !data.insights || data.insights.length === 0) {
    return null; // Don't show empty state, just hide the widget
  }

  const insights = data.insights;

  return (
    <Card className="solid-card animate-fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="size-4" />
            Insights & Suggestions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          {insights.map((insight, index) => {
            const config = getSeverityConfig(insight.kind);
            const Icon = config.icon;

            return (
              <div
                key={insight.kind}
                className={cn(
                  "rounded-lg border p-3 animate-fade-in-up",
                  config.bg,
                  config.border,
                  "border"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={cn("size-5 mt-0.5 flex-shrink-0", config.color)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", config.color)}>
                      {insight.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
