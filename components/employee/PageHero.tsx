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
  success: "text-success dark:text-success/90",
  warning: "text-warning dark:text-warning/90",
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
    <div className={cn("p-1 space-y-6", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
            <span className="uppercase tracking-[0.2em] text-[10px]">{eyebrow}</span>
            <span>•</span>
            <span>{todayLabel}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 pt-2">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[20px] bg-card border border-border/60 px-4 py-3 hover:border-border/90 transition shadow-sm"
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

