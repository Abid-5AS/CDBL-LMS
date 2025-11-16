"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Skeleton } from "@/components/ui";
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

const insightAccent = (kind: string) => {
  if (kind.match(/(WARNING|LAPSE|RISK)/i)) {
    return { Icon: AlertTriangle, color: "var(--color-data-warning)", label: "Warning" };
  }
  if (kind.match(/(ERROR|ACTION)/i)) {
    return { Icon: XCircle, color: "var(--color-data-error)", label: "Action" };
  }
  return { Icon: Info, color: "var(--color-data-info)", label: "Info" };
};

export function InsightsWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data, isLoading, error } = useSWR<{ insights: Insight[] }>(
    "/api/dashboard/insights",
    apiFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 300000,
    }
  );

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-2xl" />;
  }

  if (error || !data?.insights?.length) {
    return null;
  }

  const insights = data.insights;

  return (
    <div className="neo-card animate-fade-in-up space-y-4 px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/20 p-3 shadow-inner">
            <Lightbulb className="h-5 w-5 text-data-warning" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Insights
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              Recommendations
            </h3>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const { Icon, color, label } = insightAccent(insight.kind);
            return (
              <div
                key={`${insight.kind}-${index}`}
                className="rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--color-card)90%,transparent)] px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5" style={{ color }} />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {insight.text}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
                        style={{ color }}
                      >
                        {label}
                      </span>
                    </div>
                    {insight.meta?.link && (
                      <Button asChild variant="ghost" size="sm" className="px-0 text-[13px]">
                        <Link href={insight.meta.link}>View detail</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
