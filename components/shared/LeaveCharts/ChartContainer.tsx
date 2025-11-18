"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui";
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
      const rafId = requestAnimationFrame(() => {
        if (renderStartRef.current) {
          const renderTime = performance.now() - renderStartRef.current;
          onRender(renderTime);
        }
      });

      // Cleanup function - cancel the animation frame if component unmounts
      return () => {
        cancelAnimationFrame(rafId);
      };
    }

    // Also return cleanup function when the condition isn't met
    return () => {};
  }, [loading, empty, onRender]);

  return (
    <div className={cn("neo-card space-y-4 px-6 py-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            {subtitle || "Analytics"}
          </p>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        {actionsSlot && <div className="flex-shrink-0">{actionsSlot}</div>}
      </div>
      {loading ? (
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      ) : empty ? (
        <div className="flex h-full items-center justify-center" style={{ height: `${height}px` }}>
          <EmptyState icon={BarChart3} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
