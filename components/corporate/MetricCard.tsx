"use client";

import { cn } from "@/lib/utils";
import type { DensityMode } from "@/lib/ui/density-modes";
import { metricCard, getTypography } from "@/lib/ui/density-modes";

interface MetricCardProps {
  label: string | React.ReactNode;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  icon?: React.ComponentType<{ className?: string }>;
  density?: DensityMode;
  className?: string;
  onClick?: () => void;
}

/**
 * Corporate Metric Card
 * Theme-aware component for KPIs and statistics
 *
 * Design: Clean card with bold numbers, theme-compatible colors
 */
export function MetricCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  density = "comfortable",
  className,
  onClick,
}: MetricCardProps) {
  const typography = getTypography(density);

  return (
    <div
      className={cn(
        metricCard(density),
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(typography.label, "text-muted-foreground")}>{label}</p>
          <p className={cn(typography.kpiNumber, "mt-2 text-foreground")}>{value}</p>
          {subtitle && (
            <p className={cn(typography.body, "mt-1 text-muted-foreground")}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "up" && "text-data-success",
                  trend.direction === "down" && "text-data-error",
                  trend.direction === "neutral" && "text-muted-foreground"
                )}
              >
                {trend.direction === "up" && "↑"}
                {trend.direction === "down" && "↓"}
                {trend.direction === "neutral" && "→"}
                {" "}
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
