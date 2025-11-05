"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronDown, ChevronUp, Info, AlertTriangle, XCircle } from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Insight {
  kind: string;
  text: string;
  meta?: Record<string, any>;
}

function getSeverityConfig(kind: string) {
  if (kind.includes("WARNING") || kind.includes("LAPSE") || kind.includes("RISK")) {
    return {
      icon: AlertTriangle,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      border: "border-yellow-200 dark:border-yellow-800",
    };
  }
  if (kind.includes("ERROR") || kind.includes("ACTION")) {
    return {
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
    };
  }
  return {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
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
                  <Icon className={cn("size-5 mt-0.5 flex-shrink-0", config.color)} />
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
