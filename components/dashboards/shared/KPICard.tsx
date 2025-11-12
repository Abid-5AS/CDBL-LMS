"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

const variantStyles = {
  default: {
    card: "glass-card hover:shadow-lg",
    icon: "text-foreground/70",
    iconBg: "bg-muted/50",
  },
  success: {
    card: "glass-card hover:shadow-lg border-l-4 border-l-data-success",
    icon: "text-data-success",
    iconBg: "bg-data-success/10",
  },
  warning: {
    card: "glass-card hover:shadow-lg border-l-4 border-l-data-warning",
    icon: "text-data-warning",
    iconBg: "bg-data-warning/10",
  },
  error: {
    card: "glass-card hover:shadow-lg border-l-4 border-l-data-error",
    icon: "text-data-error",
    iconBg: "bg-data-error/10",
  },
  info: {
    card: "glass-card hover:shadow-lg border-l-4 border-l-data-info",
    icon: "text-data-info",
    iconBg: "bg-data-info/10",
  },
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
  const styles = variantStyles[variant];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-data-success";
    if (trend.value < 0) return "text-data-error";
    return "text-muted-foreground";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      className={cn(
        styles.card,
        "rounded-2xl p-6 transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-muted/50 animate-pulse rounded" />
              {subtitle && (
                <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
              )}
            </div>
          ) : (
            <>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold tracking-tight mt-1"
              >
                {value}
              </motion.p>

              {subtitle && (
                <p className="text-sm text-muted-foreground mt-2">
                  {subtitle}
                </p>
              )}

              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  {TrendIcon && (
                    <TrendIcon className={cn("h-4 w-4", getTrendColor())} />
                  )}
                  <span className={cn("text-sm font-medium", getTrendColor())}>
                    {trend.value > 0 ? "+" : ""}
                    {trend.value}%
                  </span>
                  {trend.label && (
                    <span className="text-sm text-muted-foreground ml-1">
                      {trend.label}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {Icon && (
          <div className={cn("p-3 rounded-xl", styles.iconBg)}>
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Skeleton loader for KPI cards
export function KPICardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
          <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
        </div>
        <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl" />
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
