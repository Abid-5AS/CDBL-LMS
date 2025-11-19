"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroStat = {
  label: string;
  value: ReactNode;
  state?: "default" | "success" | "warning" | "danger";
  helper?: string;
};

type EmployeePageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  stats?: HeroStat[];
  actions?: ReactNode;
  className?: string;
};

const stateClasses: Record<
  NonNullable<HeroStat["state"]>,
  string
> = {
  default: "text-foreground",
  success: "text-data-success",
  warning: "text-data-warning",
  danger: "text-destructive",
};

export function EmployeePageHero({
  eyebrow = "Employee Experience",
  title,
  description,
  stats,
  actions,
  className,
}: EmployeePageHeroProps) {
  const today = new Date();
  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className={cn("surface-card p-6 space-y-6", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground leading-6 max-w-3xl">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="rounded-xl border border-border/70 px-4 py-3 text-center text-sm text-muted-foreground shadow-sm">
            <p className="text-xs uppercase tracking-widest">Today</p>
            <p className="text-xl font-semibold text-foreground">{todayLabel}</p>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/70 px-4 py-3 hover:border-border/90 transition"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p
                className={cn(
                  "text-xl font-semibold text-foreground",
                  stat.state ? stateClasses[stat.state] : undefined
                )}
              >
                {stat.value}
              </p>
              {stat.helper && (
                <p className="text-xs text-muted-foreground mt-1">{stat.helper}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

