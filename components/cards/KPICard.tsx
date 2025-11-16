"use client";

import type { ComponentType, CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

type KPICardProps = {
  title: string;
  value: string;
  subtext?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  // Enhanced props
  progress?: {
    used: number;
    total: number;
    label?: string;
  };
  status?: "healthy" | "low" | "critical";
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  // Material 3 enhancements
  accentColor?: string;
  className?: string;
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
  accentColor,
  className,
}: KPICardProps) {
  const progressPercentage = progress?.total
    ? Math.min(
        Math.max((progress.used / Math.max(progress.total, 1)) * 100, 0),
        100
      )
    : undefined;

  const STATUS_THEMES: Record<
    NonNullable<typeof status> | "default",
    { label: string; color: string }
  > = {
    healthy: { label: "On track", color: "var(--color-data-success)" },
    low: { label: "Watch", color: "var(--color-data-warning)" },
    critical: { label: "Critical", color: "var(--color-data-error)" },
    default: { label: "Stable", color: "var(--color-brand)" },
  };

  const convertBgClassToVar = (value?: string) => {
    if (!value) return undefined;
    const match = value.match(/^bg-([A-Za-z0-9-]+)/);
    if (!match) return undefined;
    return `var(--color-${match[1]})`;
  };

  const accentColorValue =
    convertBgClassToVar(accentColor) ??
    STATUS_THEMES[status ?? "default"].color;

  type AccentVars = CSSProperties & {
    "--kpi-accent"?: string;
    "--kpi-accent-soft"?: string;
    "--kpi-accent-strong"?: string;
    "--kpi-accent-muted"?: string;
  };

  const accentVars: AccentVars = {
    "--kpi-accent": accentColorValue,
    "--kpi-accent-soft": `color-mix(in srgb, ${accentColorValue} 15%, transparent)`,
    "--kpi-accent-strong": `color-mix(in srgb, ${accentColorValue} 55%, transparent)`,
    "--kpi-accent-muted": `color-mix(in srgb, ${accentColorValue} 8%, transparent)`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
    >
      <div
        className={cn(
          "neo-card group relative overflow-hidden",
          "px-6 py-5 sm:px-7 sm:py-6",
          className
        )}
        style={accentVars}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient( circle at 20% 0%, var(--kpi-accent-soft), transparent 60% )",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-6 top-4 h-px opacity-80"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--kpi-accent), transparent)",
          }}
        />

        <div className="relative flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--color-foreground-subtle)]">
                <span className="text-ellipsis whitespace-nowrap">
                  {title}
                </span>
                {badge && (
                  <Badge variant={badgeVariant} className="tracking-normal">
                    {badge}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-foreground">
                  {value}
                </p>
                {subtext && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {subtext}
                  </p>
                )}
              </div>
            </div>

            {Icon && (
              <div
                className="rounded-2xl border border-white/20 p-3 shadow-inner dark:border-white/5"
                style={{
                  background:
                    "linear-gradient(145deg, var(--kpi-accent-soft), transparent)",
                  color: iconColor ? undefined : "var(--kpi-accent)",
                }}
              >
                <Icon
                  size={20}
                  className={cn("h-5 w-5", iconColor)}
                  style={!iconColor ? { color: "var(--kpi-accent)" } : undefined}
                />
              </div>
            )}
          </div>

          {status && (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span
                className="inline-flex size-2 rounded-full"
                style={{ backgroundColor: "var(--kpi-accent)" }}
              />
              <span>{STATUS_THEMES[status].label}</span>
            </div>
          )}

          {progress && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {progress.used} / {progress.total} {progress.label ?? "days"}
                </span>
                <span className="font-semibold text-foreground">
                  {Math.round(progressPercentage ?? 0)}%
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-[var(--kpi-accent-muted)]/40">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progressPercentage ?? 0}%`,
                    background:
                      "linear-gradient(90deg, var(--kpi-accent-soft), var(--kpi-accent))",
                    boxShadow:
                      "0 6px 18px color-mix(in srgb, var(--kpi-accent) 25%, transparent)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

type KPIGridProps = {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
};

/**
 * KPIGrid - Responsive grid container for KPI cards
 * Material 3 style: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
 */
export function KPIGrid({ children, className, columns = 3 }: KPIGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 xl:grid-cols-3",
    4: "md:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6",
        gridCols[columns],
        className
      )}
    >
      {children}
    </div>
  );
}
// ...existing code from components/shared/KPICard.tsx will be moved here
