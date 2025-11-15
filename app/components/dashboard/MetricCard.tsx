"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MetricCard Props Interface
 *
 * @interface MetricCardProps
 * @property {string} title - Card title/label (e.g., "Pending Requests")
 * @property {number | string} value - Main metric value to display
 * @property {string} [unit] - Optional unit (e.g., "days", "hrs")
 * @property {Object} [trend] - Optional trend indicator
 * @property {() => void} [onClick] - Optional click handler for navigation
 * @property {React.ComponentType} [icon] - Optional Lucide icon component
 * @property {'default'|'warning'|'success'|'error'} [variant] - Color variant
 * @property {boolean} [isLoading] - Loading state
 */
export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    direction: "up" | "down" | "stable";
    change: number;
  };
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "default" | "warning" | "success" | "error";
  isLoading?: boolean;
  className?: string;
  subtitle?: string;
}

const variantStyles = {
  default: {
    card: "bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700",
    icon: "text-gray-700 dark:text-gray-300",
    iconBg: "bg-gray-100 dark:bg-gray-800",
    value: "text-gray-900 dark:text-gray-100",
  },
  success: {
    card: "bg-white dark:bg-slate-900 border-l-4 border-l-green-500",
    icon: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-50 dark:bg-green-950",
    value: "text-gray-900 dark:text-gray-100",
  },
  warning: {
    card: "bg-white dark:bg-slate-900 border-l-4 border-l-yellow-500",
    icon: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-50 dark:bg-yellow-950",
    value: "text-gray-900 dark:text-gray-100",
  },
  error: {
    card: "bg-white dark:bg-slate-900 border-l-4 border-l-red-500",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-50 dark:bg-red-950",
    value: "text-gray-900 dark:text-gray-100",
  },
};

/**
 * MetricCard Component
 *
 * A reusable card component for displaying key statistics and metrics.
 * Supports loading states, trend indicators, icons, and click interactions.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Pending Requests"
 *   value={12}
 *   icon={Clock}
 *   variant="warning"
 *   trend={{ direction: "up", change: 5 }}
 *   onClick={() => navigate('/requests')}
 * />
 * ```
 */
export function MetricCard({
  title,
  value,
  unit,
  trend,
  onClick,
  icon: Icon,
  variant = "default",
  isLoading = false,
  className,
  subtitle,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === "up") return TrendingUp;
    if (trend.direction === "down") return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.direction === "up") return "text-green-600 dark:text-green-400";
    if (trend.direction === "down") return "text-red-600 dark:text-red-400";
    return "text-gray-500 dark:text-gray-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      className={cn(
        "rounded-lg shadow border",
        styles.card,
        "p-6 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={`${title}: ${value}${unit ? ` ${unit}` : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              {(subtitle || unit) && (
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              )}
            </div>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-baseline gap-1"
              >
                <p className={cn("text-3xl font-bold tracking-tight", styles.value)}>
                  {value}
                </p>
                {unit && (
                  <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                    {unit}
                  </span>
                )}
              </motion.div>

              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {subtitle}
                </p>
              )}

              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  {TrendIcon && <TrendIcon className={cn("h-4 w-4", getTrendColor())} />}
                  <span className={cn("text-sm font-medium", getTrendColor())}>
                    {trend.change > 0 ? "+" : ""}
                    {trend.change}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {Icon && (
          <div
            className={cn("p-3 rounded-xl", styles.iconBg)}
            aria-hidden="true"
          >
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * MetricCard Skeleton Loader
 * Used during loading states
 */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg shadow border bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700 p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </div>
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}

/**
 * MetricCard Grid Container
 * Provides responsive grid layout for multiple metric cards
 */
export function MetricCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
