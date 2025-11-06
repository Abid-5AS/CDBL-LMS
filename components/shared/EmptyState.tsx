"use client";

import * as React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  variant?: "default" | "card" | "minimal";
};

/**
 * Unified Empty State Component
 * Consolidates empty state implementations across the codebase
 * Supports multiple variants for different contexts
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  helpText,
  className,
  variant = "default",
}: EmptyStateProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        variant === "minimal" && "py-6",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full mb-4",
            variant === "minimal"
              ? "h-12 w-12 bg-muted/50"
              : "h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30"
          )}
          aria-hidden="true"
        >
          <Icon
            className={cn(
              variant === "minimal"
                ? "h-6 w-6 text-muted-foreground"
                : "h-8 w-8 text-indigo-600 dark:text-indigo-400"
            )}
          />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold mb-1",
          variant === "minimal" ? "text-base" : "text-lg",
          "text-foreground"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-sm max-w-md mb-4",
            variant === "minimal" ? "text-muted-foreground" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
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
            <Button
              onClick={action.onClick}
              variant="outline"
              size="sm"
              aria-label={action.label}
              className="rounded-full"
            >
              {action.label}
            </Button>
          ) : null}
          {helpText && (
            <Link
              href="/help"
              className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400"
            >
              {helpText}
            </Link>
          )}
        </div>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Card>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  return content;
}

