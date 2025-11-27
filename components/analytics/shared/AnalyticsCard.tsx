"use client";

import { ReactNode } from "react";
import { Info } from "lucide-react";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  description?: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  variant?: "default" | "hover";
}

/**
 * AnalyticsCard - Standardized card component for analytics displays
 * Ensures UI consistency across all analytics dashboards
 */
export function AnalyticsCard({
  title,
  description,
  tooltip,
  children,
  className,
  headerAction,
  variant = "default",
}: AnalyticsCardProps) {
  return (
    <GlassCard
      className={cn(
        variant === "hover" && "transition-shadow hover:shadow-lg",
        className
      )}
    >
      <GlassCardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <GlassCardTitle>{title}</GlassCardTitle>
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {headerAction && <div className="ml-4">{headerAction}</div>}
        </div>
      </GlassCardHeader>
      <GlassCardContent>{children}</GlassCardContent>
    </GlassCard>
  );
}
