"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  label: string;
  current: number;
  target: number;
  color: string;
  size: number;
  unit: string;
  trend?: "up" | "down" | "stable";
}

interface AnalyticsCircleProps {
  data: AnalyticsData;
  index: number;
}

const AnalyticsCircle = ({ data, index }: AnalyticsCircleProps) => {
  const percentage = Math.min((data.current / data.target) * 100, 100);
  const radius = data.size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const accent = data.color || "var(--color-brand)";

  const animationDelay = index * 0.15;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        "--analytics-accent": accent,
        "--analytics-accent-soft": `color-mix(in srgb, ${accent} 22%, transparent)`,
        "--analytics-accent-muted": `color-mix(in srgb, ${accent} 10%, transparent)`,
      } as React.CSSProperties}
    >
      <motion.svg
        width={data.size}
        height={data.size}
        className="-rotate-90"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.7,
          delay: animationDelay,
          type: "spring",
          stiffness: 160,
        }}
      >
        <circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          stroke="var(--analytics-accent-muted)"
        />
        <motion.circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={radius}
          fill="none"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke="var(--analytics-accent)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.2,
            delay: animationDelay + 0.2,
            ease: [0.23, 1, 0.32, 1],
          }}
        />
        {percentage > 80 && (
          <motion.circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            strokeWidth={2}
            stroke="var(--analytics-accent)"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: animationDelay + 0.4 }}
            className="blur-[1px]"
          />
        )}
      </motion.svg>

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: animationDelay + 0.3, type: "spring", stiffness: 220 }}
      >
        <div className="text-lg font-semibold text-foreground">
          {data.current}
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {data.unit}
        </div>
        {data.trend && (
          <span
            className={cn(
              "mt-1 text-xs font-semibold",
              data.trend === "up" && "text-data-success",
              data.trend === "down" && "text-data-error",
              data.trend === "stable" && "text-muted-foreground"
            )}
          >
            {data.trend === "up"
              ? "↗"
              : data.trend === "down"
              ? "↘"
              : "→"}
          </span>
        )}
      </motion.div>
    </div>
  );
};

interface HRAnalyticsCardProps {
  title?: string;
  metrics: AnalyticsData[];
  className?: string;
  subtitle?: string;
}

export function HRAnalyticsCard({
  title = "HR Analytics",
  metrics,
  className,
  subtitle,
}: HRAnalyticsCardProps) {
  const { overallEfficiency, accentGradient } = useMemo(() => {
    if (metrics.length === 0) {
      return { overallEfficiency: 0, accentGradient: "var(--color-brand)" };
    }
    const efficiency = Math.round(
      metrics.reduce(
        (sum, metric) => sum + (metric.current / metric.target) * 100,
        0
      ) / metrics.length
    );
    const accent = metrics[0].color || "var(--color-brand)";
    return { overallEfficiency: efficiency, accentGradient: accent };
  }, [metrics]);

  return (
    <div
      className={cn(
        "neo-card relative flex w-full flex-col gap-6 overflow-hidden px-6 py-6",
        className
      )}
      style={{
        "--analytics-card-accent": accentGradient,
        "--analytics-card-accent-soft": `color-mix(in srgb, ${accentGradient} 20%, transparent)`,
      } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, var(--analytics-card-accent-soft), transparent 55%)",
        }}
      />
      <div className="relative flex flex-col gap-2 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-1"
        >
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </motion.div>
      </div>

      <div className="relative grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="flex flex-col items-center gap-2">
            <AnalyticsCircle data={metric} index={index} />
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
              className="text-center"
            >
              <p className="text-sm font-semibold text-foreground">
                {metric.label}
              </p>
              <p
                className="text-xs font-medium text-muted-foreground"
                style={{ color: metric.color || undefined }}
              >
                {metric.current}/{metric.target}
              </p>
            </motion.div>
          </div>
        ))}
      </div>

      <motion.div
        className="relative flex flex-col items-center gap-2 border-t border-border pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Overall Efficiency
        </p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-semibold text-foreground">
            {overallEfficiency}%
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full",
              overallEfficiency >= 80
                ? "text-data-success"
                : overallEfficiency >= 60
                ? "text-data-warning"
                : "text-data-error"
            )}
          >
            {overallEfficiency >= 80
              ? "On Track"
              : overallEfficiency >= 60
              ? "Moderate"
              : "Attention"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function createHRAnalyticsData(data: {
  pendingApprovals: number;
  maxPendingTarget: number;
  processedToday: number;
  dailyTarget: number;
  teamUtilization: number;
  utilizationTarget: number;
  complianceScore: number;
  complianceTarget: number;
}): AnalyticsData[] {
  return [
    {
      label: "Pending",
      current: data.pendingApprovals,
      target: data.maxPendingTarget,
      color: "var(--color-data-error)",
      size: 96,
      unit: "requests",
      trend:
        data.pendingApprovals > data.maxPendingTarget * 0.8
          ? "up"
          : data.pendingApprovals < data.maxPendingTarget * 0.3
          ? "down"
          : "stable",
    },
    {
      label: "Processed",
      current: data.processedToday,
      target: data.dailyTarget,
      color: "var(--color-data-success)",
      size: 96,
      unit: "today",
      trend: data.processedToday >= data.dailyTarget ? "up" : "down",
    },
    {
      label: "Utilization",
      current: data.teamUtilization,
      target: data.utilizationTarget,
      color: "var(--color-data-info)",
      size: 96,
      unit: "%",
      trend:
        data.teamUtilization >= data.utilizationTarget * 0.9 ? "up" : "down",
    },
    {
      label: "Compliance",
      current: data.complianceScore,
      target: data.complianceTarget,
      color: "var(--color-data-warning)",
      size: 96,
      unit: "score",
      trend:
        data.complianceScore >= data.complianceTarget * 0.95
          ? "up"
          : data.complianceScore < data.complianceTarget * 0.8
          ? "down"
          : "stable",
    },
  ];
}
