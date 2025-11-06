"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../EmptyState";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type ChartContainerProps = {
  title: string;
  subtitle?: string;
  actionsSlot?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: ReactNode;
  className?: string;
  height?: number;
  onRender?: (renderTime: number) => void; // Optional telemetry hook
};

/**
 * ChartContainer - Unified wrapper for all charts
 * Handles responsive box, skeletons, empty state, dark mode
 */
export function ChartContainer({
  title,
  subtitle,
  actionsSlot,
  loading = false,
  empty = false,
  emptyTitle = "No data available",
  emptyDescription = "There is no data to display for this chart.",
  children,
  className,
  height = 300,
  onRender,
}: ChartContainerProps) {
  const renderStartRef = useRef<number | null>(null);
  const hasRenderedRef = useRef(false);

  useEffect(() => {
    if (!loading && !empty && !hasRenderedRef.current && onRender) {
      renderStartRef.current = performance.now();
      hasRenderedRef.current = true;
      
      // Measure render time after paint
      requestAnimationFrame(() => {
        if (renderStartRef.current) {
          const renderTime = performance.now() - renderStartRef.current;
          onRender(renderTime);
        }
      });
    }
  }, [loading, empty, onRender]);

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle>{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {actionsSlot && <div className="flex-shrink-0">{actionsSlot}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full" style={{ height: `${height}px` }} />
        ) : empty ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <EmptyState
              icon={BarChart3}
              title={emptyTitle}
              description={emptyDescription}
            />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

