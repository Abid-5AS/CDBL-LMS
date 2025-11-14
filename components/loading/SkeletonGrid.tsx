/**
 * SkeletonGrid Component
 *
 * Grid of skeleton loaders that adapts to different breakpoints
 * Used as loading fallback for grid-based content
 */

import { cn } from "@/lib/utils";
import { SkeletonCard, SkeletonCardCompact } from "./SkeletonCard";

interface SkeletonGridProps {
  /** Number of skeleton items to display */
  count?: number;

  /** Grid columns pattern: "mobile:tablet:desktop:wide" */
  columns?: string;

  /** Use compact skeletons (smaller cards) */
  compact?: boolean;

  /** Gap size: "sm" | "md" | "lg" */
  gap?: "sm" | "md" | "lg";

  /** Custom className for grid container */
  className?: string;

  /** Custom className for individual skeletons */
  itemClassName?: string;
}

const gapClasses = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

/**
 * Convert column pattern to CSS grid classes
 * Pattern: "1:2:3:4" -> mobile:tablet:desktop:wide
 */
function getGridClasses(columns: string): string {
  const [mobile, tablet, desktop, wide] = columns.split(":").map(Number);

  return cn(
    // Mobile: 1 column
    `grid-cols-${mobile}`,
    // Tablet: 2 columns
    `sm:grid-cols-${tablet}`,
    // Desktop: 3 columns
    `lg:grid-cols-${desktop}`,
    // Wide: 4 columns
    `xl:grid-cols-${wide}`
  );
}

/**
 * SkeletonGrid - Responsive grid of skeleton cards
 *
 * @example
 * ```tsx
 * // 4 skeleton cards in 2:2:4:4 grid
 * <SkeletonGrid count={4} columns="2:2:4:4" gap="md" />
 *
 * // 3 compact skeletons
 * <SkeletonGrid count={3} compact columns="1:1:3:3" gap="md" />
 *
 * // Custom styling
 * <SkeletonGrid
 *   count={6}
 *   columns="1:2:3:3"
 *   gap="lg"
 *   itemClassName="h-32"
 * />
 * ```
 */
export function SkeletonGrid({
  count = 4,
  columns = "1:2:2:4",
  compact = false,
  gap = "md",
  className,
  itemClassName,
}: SkeletonGridProps) {
  const [mobile, tablet, desktop, wide] = columns.split(":").map(Number);

  // Inline styles for grid since Tailwind dynamic classes won't work
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${mobile}, minmax(0, 1fr))`,
    gap: gap === "sm" ? "16px" : gap === "lg" ? "32px" : "24px",
  } as React.CSSProperties;

  // Mobile media queries for responsive columns
  const baseClass = cn(
    "grid",
    gapClasses[gap],
    className
  );

  return (
    <div style={gridStyle} className={baseClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "min-w-0", // Prevent overflow
            itemClassName
          )}
        >
          {compact ? (
            <SkeletonCardCompact />
          ) : (
            <SkeletonCard showIcon />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonGridKPI - Skeleton grid optimized for KPI cards
 * Uses standard 2:2:4:4 grid pattern for KPI display
 */
export function SkeletonGridKPI({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <SkeletonGrid
      count={count}
      columns="2:2:4:4"
      gap="md"
      className={className}
    />
  );
}

/**
 * SkeletonGridMetrics - Skeleton grid optimized for metrics/stats
 * Uses standard 1:1:3:3 grid pattern for secondary metrics
 */
export function SkeletonGridMetrics({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <SkeletonGrid
      count={count}
      columns="1:1:3:3"
      gap="md"
      compact
      className={className}
    />
  );
}

/**
 * SkeletonGridActions - Skeleton grid for action buttons/cards
 * Uses 1:2:3 pattern with more spacing
 */
export function SkeletonGridActions({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}
