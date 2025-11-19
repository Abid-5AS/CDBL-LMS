"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "error" | "info";
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantAccent: Record<
  NonNullable<KPICardProps["variant"]>,
  string
> = {
  default: "var(--color-brand)",
  success: "var(--color-data-success)",
  warning: "var(--color-data-warning)",
  error: "var(--color-data-error)",
  info: "var(--color-data-info)",
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  isLoading = false,
  className,
  onClick,
}: KPICardProps) {
  const accent = useMemo(() => variantAccent[variant], [variant]);

  type AccentVars = CSSProperties & {
    "--kpi-accent"?: string;
    "--kpi-accent-soft"?: string;
    "--kpi-accent-muted"?: string;
  };

  const accentVars: AccentVars = useMemo(
    () => ({
      "--kpi-accent": accent,
      "--kpi-accent-soft": `color-mix(in srgb, ${accent} 18%, transparent)`,
      "--kpi-accent-muted": `color-mix(in srgb, ${accent} 6%, transparent)`,
    }),
    [accent]
  );

  const renderTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3.5 w-3.5" />;
    if (trend.value < 0) return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{
        y: -4,
        scale: onClick ? 1.01 : 1,
      }}
      className={cn(onClick && "cursor-pointer", className)}
      onClick={onClick}
      style={accentVars}
    >
      <div className="neo-card group relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
        {/* Removed gradient effect for professional look */}
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--color-foreground-subtle)]">
              {title}
            </p>

            {isLoading ? (
              <div className="mt-4 space-y-2">
                <div className="h-8 w-24 animate-pulse rounded bg-muted/60" />
                {subtitle && (
                  <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
                )}
              </div>
            ) : (
              <>
                <motion.p
                  initial={{ scale: 0.92, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 text-3xl font-semibold tracking-tight text-foreground"
                >
                  {value}
                </motion.p>

                {subtitle && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                )}

                {trend && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--kpi-accent-soft)]/70 px-3 py-1 text-xs font-semibold text-[color:var(--kpi-accent)]">
                    {renderTrendIcon()}
                    <span>
                      {trend.value > 0 ? "+" : ""}
                      {trend.value}%
                    </span>
                    {trend.label && (
                      <span className="text-[color:var(--color-foreground-subtle)]/80">
                        {trend.label}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {Icon && (
            <div
              className="rounded-xl border border-border/50 p-3 bg-accent/10"
              style={{
                color: "var(--kpi-accent)",
              }}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton loader for KPI cards
export function KPICardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("neo-card rounded-2xl p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
          <div className="h-9 w-28 animate-pulse rounded bg-muted/50" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
        </div>
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}

// Grid container for KPI cards
export function KPIGrid({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
