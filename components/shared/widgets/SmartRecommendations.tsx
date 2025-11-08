"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Badge,
} from "@/components/ui";
import { Sparkles } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

export function SmartRecommendations() {
  const { data, error, isLoading } = useSWR(
    "/api/dashboard/recommendations",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 600000, // Refresh every 10 minutes
    }
  );

  const recommendations: Recommendation[] = data?.recommendations || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-data-warning" />
          Smart Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 ${
                rec.severity === "warning"
                  ? "border-data-warning bg-data-warning"
                  : "border-data-info bg-data-info"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-text-secondary">
                      {rec.title}
                    </h4>
                    <Badge
                      variant={
                        rec.severity === "warning" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {rec.severity === "warning" ? "Important" : "Suggested"}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">{rec.message}</p>
                </div>
              </div>
              {rec.action && (
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={rec.action.href}>{rec.action.label}</Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
