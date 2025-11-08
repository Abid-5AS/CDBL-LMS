import * as React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  helpText?: string;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  helpText,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-card-action mb-4" aria-hidden="true">
          <Icon className="h-8 w-8 text-card-action" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-secondary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-md mb-4">{description}</p>
      )}
      {action && (
        <div className="flex flex-col gap-2 items-center">
          {action.href ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={action.href} aria-label={action.label}>
                {action.label}
              </Link>
            </Button>
          ) : action.onClick ? (
            <Button onClick={action.onClick} variant="outline" size="sm" aria-label={action.label} className="rounded-full">
              {action.label}
            </Button>
          ) : null}
          {helpText && (
            <Link href="/help" className="text-xs text-card-action hover:text-card-action hover:underline">
              {helpText}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

