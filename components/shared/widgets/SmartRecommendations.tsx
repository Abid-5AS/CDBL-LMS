"use client";

import useSWR from "swr";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { apiFetcher } from "@/lib/apiClient";
import { Button, Skeleton } from "@/components/ui";

interface Recommendation {
  type:
    | "holiday_bridge"
    | "balance_optimization"
    | "certificate_reminder"
    | "consecutive_warning";
  title: string;
  message: string;
  severity: "info" | "warning";
  action?: {
    label: string;
    href: string;
  };
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
}

export function SmartRecommendations() {
  const { data, error, isLoading } = useSWR<RecommendationsResponse>(
    "/api/dashboard/recommendations",
    apiFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 600000,
    }
  );

  const recommendations = data?.recommendations || [];

  if (isLoading) {
    return (
      <div className="neo-card animate-pulse space-y-4 px-6 py-6">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  const severityAccent: Record<Recommendation["severity"], string> = {
    warning: "var(--color-data-warning)",
    info: "var(--color-data-info)",
  };

  return (
    <div className="neo-card space-y-5 px-6 py-6">
      <div className="flex items-center gap-3">
        <div
          className="rounded-2xl border border-white/20 p-3 shadow-inner"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-data-warning) 20%, transparent), transparent)",
          }}
        >
          <Sparkles className="h-5 w-5" style={{ color: "var(--color-data-warning)" }} />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            Assistant
          </p>
          <h3 className="text-xl font-semibold text-foreground">
            Smart Recommendations
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const accent = severityAccent[rec.severity];
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border px-4 py-4"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
              }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {rec.title}
                    </h4>
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.25em]"
                      style={{ color: accent }}
                    >
                      {rec.severity === "warning" ? "Important" : "Suggested"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.message}</p>
                </div>
                {rec.action && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={rec.action.href}>{rec.action.label}</Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
