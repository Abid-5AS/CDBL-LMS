"use client";

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  badge?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
  badge,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-outline/60 bg-surface-1 px-6 py-8 text-center shadow-card dark:border-border",
        className,
      )}
    >
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
          <Icon className="h-6 w-6" />
        </span>
      )}
      {badge}
      <div className="space-y-1">
        <h3 className="heading-sm">{title}</h3>
        {description && <p className="body-muted max-w-md">{description}</p>}
      </div>
      {action}
    </div>
  );
}
