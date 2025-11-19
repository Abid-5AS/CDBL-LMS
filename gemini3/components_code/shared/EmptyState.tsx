"use client";

import * as React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

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
 * Unified Empty State Component - Neo Style
 * Consolidates empty state implementations with refined aesthetics
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        variant === "minimal" && "py-8",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl mb-6",
            "border border-[var(--shell-card-border)]",
            "bg-gradient-to-br from-[rgba(91,94,252,0.06)] to-transparent",
            "shadow-[0_2px_8px_rgba(91,94,252,0.08)]",
            variant === "minimal" ? "h-14 w-14" : "h-20 w-20"
          )}
          aria-hidden="true"
        >
          <Icon
            className={cn(
              "text-[rgb(91,94,252)]",
              variant === "minimal" ? "h-7 w-7" : "h-10 w-10"
            )}
          />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold mb-2 tracking-tight",
          variant === "minimal" ? "text-base" : "text-xl",
          "text-[var(--color-text-primary)]"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-sm max-w-md mb-6 leading-relaxed",
            "text-[var(--color-text-secondary)]"
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="flex flex-col gap-3 items-center">
          {action.href ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="neo-button rounded-xl"
            >
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
              className="neo-button rounded-xl"
            >
              {action.label}
            </Button>
          ) : null}
          {helpText && (
            <Link
              href="/help"
              className="text-xs text-[rgb(91,94,252)] hover:text-[rgb(71,74,232)] hover:underline transition-colors duration-200"
            >
              {helpText}
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );

  if (variant === "card") {
    return <div className="neo-card">{content}</div>;
  }

  return content;
}
