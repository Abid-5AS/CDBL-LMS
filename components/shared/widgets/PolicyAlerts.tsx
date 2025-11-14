"use client";

import useSWR from "swr";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Skeleton,
} from "@/components/ui";
import { AlertCircle, Info, AlertTriangle } from "lucide-react";
import Link from "next/link";
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

export function PolicyAlerts() {
  const { data, error, isLoading } = useSWR<AlertsResponse>("/api/dashboard/alerts", apiFetcher, {
    revalidateOnFocus: true,
    refreshInterval: 300000, // Refresh every 5 minutes
  });

  const alerts: AlertItem[] = data?.alerts || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error || alerts.length === 0) {
    return null;
  }

  const getSeverityConfig = (severity: AlertItem["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          variant: "destructive" as const,
          icon: AlertCircle,
          className: "border-data-error bg-data-error",
        };
      case "warning":
        return {
          variant: "destructive" as const,
          icon: AlertTriangle,
          className: "border-data-warning bg-data-warning",
        };
      default:
        return {
          variant: "default" as const,
          icon: Info,
          className: "border-data-info bg-data-info",
        };
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const config = getSeverityConfig(alert.severity);
        const Icon = config.icon;

        return (
          <Alert key={index} className={config.className}>
            <Icon className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">
              {alert.title}
            </AlertTitle>
            <AlertDescription className="text-sm text-text-secondary mt-1">
              {alert.message}
              {alert.action && (
                <div className="mt-3">
                  <Button
                    asChild
                    variant={
                      alert.severity === "critical" ? "destructive" : "default"
                    }
                    size="sm"
                  >
                    <Link href={alert.action.href}>{alert.action.label}</Link>
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
