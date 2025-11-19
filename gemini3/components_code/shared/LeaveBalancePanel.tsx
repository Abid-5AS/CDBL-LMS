"use client";

import {
  useMemo,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui";
import { EmptyState } from "./EmptyState";
import { Umbrella, Zap, HeartPulse, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type BalanceType = "EARNED" | "CASUAL" | "MEDICAL";

export type Balance = {
  type: BalanceType;
  used: number;
  total: number;
  projected?: number;
  carryForward?: number;
};

export type LeaveBalancePanelProps = {
  balances: Balance[];
  variant?: "full" | "compact";
  showMeters?: boolean;
  showPolicyHints?: boolean;
  onClickType?: (t: BalanceType) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
};

const TYPE_CONFIG: Record<
  BalanceType,
  {
    label: string;
    icon: typeof Umbrella;
    accent: string;
  }
> = {
  EARNED: {
    label: "Earned Leave",
    icon: Umbrella,
    accent: "var(--color-leave-earned, #16a34a)",
  },
  CASUAL: {
    label: "Casual Leave",
    icon: Zap,
    accent: "var(--color-leave-casual, #2563eb)",
  },
  MEDICAL: {
    label: "Medical Leave",
    icon: HeartPulse,
    accent: "var(--color-leave-medical, #0ea5e9)",
  },
};

type AccentVars = CSSProperties & {
  "--balance-accent"?: string;
  "--balance-accent-soft"?: string;
  "--balance-accent-muted"?: string;
};

const createAccentVars = (accent: string): AccentVars => ({
  "--balance-accent": accent,
  "--balance-accent-soft": `color-mix(in srgb, ${accent} 18%, transparent)`,
  "--balance-accent-muted": `color-mix(in srgb, ${accent} 8%, transparent)`,
});

function ProgressBar({
  percent,
  label,
  accent,
  className,
}: {
  percent: number;
  label: string;
  accent: string;
  className?: string;
}) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const trackBg = `color-mix(in srgb, ${accent} 10%, transparent)`;
  const indicatorBg = `linear-gradient(90deg, color-mix(in srgb, ${accent} 35%, transparent), ${accent})`;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(clampedPercent)}%</span>
      </div>
      <div
        className="relative h-2 rounded-full"
        style={{ backgroundColor: trackBg }}
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
        aria-label={`${label}: ${Math.round(clampedPercent)}% used`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${clampedPercent}%`,
            backgroundImage: indicatorBg,
            boxShadow: `0 6px 18px color-mix(in srgb, ${accent} 25%, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

function CircularMeter({
  percent,
  accent,
  size = 80,
  children,
}: {
  percent: number;
  accent: string;
  size?: number;
  children?: ReactNode;
}) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const dash = clampedPercent * 0.9;
  const trackColor = `color-mix(in srgb, ${accent} 15%, transparent)`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="2"
          stroke={trackColor}
        />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="2"
          strokeDasharray={`${dash}, 100`}
          strokeLinecap="round"
          stroke={accent}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export function LeaveBalancePanel({
  balances,
  variant = "full",
  showMeters = true,
  showPolicyHints = false,
  onClickType,
  loading = false,
  emptyState,
  className,
}: LeaveBalancePanelProps) {
  const sortedBalances = useMemo(() => {
    const order: BalanceType[] = ["EARNED", "CASUAL", "MEDICAL"];
    return [...balances].sort(
      (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
    );
  }, [balances]);

  if (loading) {
    const skeletonGrid =
      variant === "compact"
        ? "grid grid-cols-1 gap-2 sm:grid-cols-3"
        : "grid grid-cols-1 gap-4 md:grid-cols-3";
    const skeletonHeight = variant === "compact" ? "h-24" : "h-44";
    return (
      <div className={cn(skeletonGrid, className)}>
        {[0, 1, 2].map((idx) => (
          <Skeleton
            key={idx}
            className={cn(skeletonHeight, "rounded-2xl bg-muted/40")}
          />
        ))}
      </div>
    );
  }

  if (sortedBalances.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <EmptyState
        icon={Info}
        title="No balance information"
        description="Leave balance information is not available."
      />
    );
  }

  const getInteractiveProps = (type: BalanceType) =>
    onClickType
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick: () => onClickType(type),
          onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClickType(type);
            }
          },
        }
      : {};

  if (variant === "compact") {
    const totalRemaining = sortedBalances.reduce((sum, b) => {
      const remaining = Math.max(b.total - b.used, 0);
      return sum + remaining;
    }, 0);

    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-end">
          <span className="text-2xl font-semibold text-foreground">
            {totalRemaining}
          </span>
          <span>Days Remaining</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sortedBalances.map((balance) => {
            const config = TYPE_CONFIG[balance.type];
            const Icon = config.icon;
            const remaining = Math.max(balance.total - balance.used, 0);
            const percentRemaining =
              balance.total > 0 ? (remaining / balance.total) * 100 : 0;
            const accentVars = createAccentVars(config.accent);

            return (
              <div
                key={balance.type}
                className={cn(
                  "neo-card group flex flex-col items-center gap-2 text-center",
                  onClickType && "cursor-pointer transition hover:-translate-y-1"
                )}
                style={accentVars}
                {...getInteractiveProps(balance.type)}
              >
                {showMeters && (
                  <CircularMeter
                    percent={percentRemaining}
                    accent={config.accent}
                    size={82}
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {remaining}
                    </span>
                  </CircularMeter>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {config.label.split(" ")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {remaining}/{balance.total} days
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-foreground-subtle)]">
                  <Icon className="h-4 w-4" />
                  <span>{Math.round(percentRemaining)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {sortedBalances.map((balance) => {
          const config = TYPE_CONFIG[balance.type];
          const Icon = config.icon;
          const remaining = Math.max(balance.total - balance.used, 0);
          const percentUsed =
            balance.total > 0 ? (balance.used / balance.total) * 100 : 0;
          const percentRemaining = 100 - percentUsed;
          const accentVars = createAccentVars(config.accent);

          return (
            <div
              key={balance.type}
              className={cn(
                "neo-card group relative flex flex-col gap-4 overflow-hidden px-6 py-6",
                onClickType && "cursor-pointer transition hover:-translate-y-1"
              )}
              style={accentVars}
              {...getInteractiveProps(balance.type)}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px opacity-80"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--balance-accent), transparent)",
                }}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-2xl border border-white/20 p-3 shadow-inner dark:border-white/5"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--balance-accent-soft), transparent)",
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: "var(--balance-accent)" }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--color-foreground-subtle)]">
                        {config.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {remaining}/{balance.total} days
                      </p>
                    </div>
                  </div>
                </div>
                {showMeters && (
                  <CircularMeter
                    percent={percentRemaining}
                    accent={config.accent}
                    size={96}
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {Math.round(percentRemaining)}%
                    </span>
                  </CircularMeter>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-4xl font-semibold text-foreground">
                  {remaining}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(percentRemaining)}% remaining
                </p>
                {balance.projected !== undefined && (
                  <span
                    className="inline-flex w-fit items-center rounded-full border border-white/20 px-3 py-1 text-xs font-semibold"
                    style={{ color: "var(--balance-accent)" }}
                  >
                    Projected: {balance.projected} days
                  </span>
                )}
              </div>

              {showMeters && (
                <ProgressBar
                  percent={percentUsed}
                  label={`${balance.used}/${balance.total} used`}
                  accent={config.accent}
                  className="pt-2"
                />
              )}
            </div>
          );
        })}
      </div>

      {showPolicyHints && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor:
              "color-mix(in srgb, var(--color-data-warning) 35%, transparent)",
            backgroundColor:
              "color-mix(in srgb, var(--color-data-warning) 8%, transparent)",
          }}
        >
          <div className="flex items-start gap-3">
            <Info
              className="h-5 w-5"
              style={{ color: "var(--color-data-warning)" }}
            />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">
                Earned Leave Carry Forward
              </p>
              <p>
                Earned leave carries forward up to 60 days. {""}
                <Link
                  href="/policies#earned-leave"
                  className="font-semibold underline"
                >
                  See Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
