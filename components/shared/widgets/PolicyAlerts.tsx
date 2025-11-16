"use client";

import useSWR from "swr";
import Link from "next/link";
import { Button, Skeleton } from "@/components/ui";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { apiFetcher } from "@/lib/apiClient";

interface AlertItem {
  type:
    | "low_balance"
    | "year_end_lapse"
    | "upcoming_leave"
    | "certificate_reminder";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

interface AlertsResponse {
  alerts: AlertItem[];
}

const severityAccent: Record<AlertItem["severity"], {
  color: string;
  Icon: typeof AlertCircle;
  label: string;
}> = {
  critical: {
    color: "var(--color-data-error)",
    Icon: AlertCircle,
    label: "Critical",
  },
  warning: {
    color: "var(--color-data-warning)",
    Icon: AlertTriangle,
    label: "Warning",
  },
  info: {
    color: "var(--color-data-info)",
    Icon: Info,
    label: "Info",
  },
};

export function PolicyAlerts() {
  const { data, error, isLoading } = useSWR<AlertsResponse>(
    "/api/dashboard/alerts",
    apiFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 300000,
    }
  );

  const alerts = data?.alerts || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  if (error || alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const { color, Icon, label } = severityAccent[alert.severity];
        return (
          <div
            key={index}
            className="neo-card relative px-5 py-4"
            style={{
              borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div
                  className="rounded-2xl border border-white/20 p-3 shadow-inner"
                  style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {alert.title}
                    </h4>
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
                      style={{ color }}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </div>
              {alert.action && (
                <Button
                  asChild
                  size="sm"
                  variant={alert.severity === "critical" ? "destructive" : "outline"}
                >
                  <Link href={alert.action.href}>{alert.action.label}</Link>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
