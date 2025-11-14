/**
 * SkeletonCard Component
 *
 * Skeleton loader that matches the shape and size of a card component
 * Used as loading fallback for card-based content
 */

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  /** Show header skeleton (title + description) */
  showHeader?: boolean;

  /** Show icon skeleton */
  showIcon?: boolean;

  /** Custom className */
  className?: string;

  /** Card height in pixels */
  height?: number;
}

/**
 * SkeletonCard - Animated skeleton loader for card content
 *
 * @example
 * ```tsx
 * // Basic skeleton
 * <SkeletonCard />
 *
 * // With header and icon
 * <SkeletonCard showHeader showIcon />
 *
 * // Custom height
 * <SkeletonCard height={400} />
 * ```
 */
export function SkeletonCard({
  showHeader = true,
  showIcon = false,
  className,
  height = 200,
}: SkeletonCardProps) {
  return (
    <div
      className={cn("glass-card rounded-2xl p-6", className)}
      style={{ minHeight: `${height}px` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3 w-full">
          {showHeader && (
            <>
              {/* Header label */}
              <div className="h-3 w-24 bg-muted/50 animate-pulse rounded" />

              {/* Main value */}
              <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />

              {/* Description */}
              <div className="h-3 w-32 bg-muted/50 animate-pulse rounded" />
            </>
          )}

          {/* Extra content area */}
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-muted/50 animate-pulse rounded" />
            <div className="h-3 w-3/4 bg-muted/50 animate-pulse rounded" />
          </div>
        </div>

        {/* Icon placeholder */}
        {showIcon && (
          <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

/**
 * SkeletonCardCompact - Smaller skeleton for compact cards
 */
export function SkeletonCardCompact({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-4", className)}>
      <div className="space-y-3">
        <div className="h-3 w-24 bg-muted/50 animate-pulse rounded" />
        <div className="h-6 w-16 bg-muted/50 animate-pulse rounded" />
        <div className="h-3 w-32 bg-muted/50 animate-pulse rounded" />
      </div>
    </div>
  );
}

/**
 * SkeletonCardWithImage - Skeleton with image placeholder
 */
export function SkeletonCardWithImage({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl overflow-hidden", className)}>
      {/* Image placeholder */}
      <div className="h-40 bg-muted/50 animate-pulse" />

      {/* Content placeholder */}
      <div className="p-4 space-y-3">
        <div className="h-3 w-24 bg-muted/50 animate-pulse rounded" />
        <div className="h-4 w-full bg-muted/50 animate-pulse rounded" />
        <div className="h-4 w-4/5 bg-muted/50 animate-pulse rounded" />
      </div>
    </div>
  );
}
