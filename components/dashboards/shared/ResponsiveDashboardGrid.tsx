"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

type ResponsiveDashboardGridProps = {
  children: ReactNode;
  className?: string;
  /**
   * Grid layout configuration for different screen sizes
   * Format: "mobile:tablet:desktop:wide"
   * Example: "1:2:3:4" means 1 col on mobile, 2 on tablet, 3 on desktop, 4 on wide screens
   */
  columns?: string;
  /**
   * Gap between grid items
   */
  gap?: "sm" | "md" | "lg" | "xl";
  /**
   * Animation configuration
   */
  animate?: boolean;
  staggerChildren?: number;
  delayChildren?: number;
};

const gapClasses = {
  sm: "gap-3 sm:gap-4",
  md: "gap-4 sm:gap-6",
  lg: "gap-6 sm:gap-8",
  xl: "gap-8 sm:gap-10",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (custom: { staggerChildren: number; delayChildren: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.staggerChildren,
      delayChildren: custom.delayChildren,
    },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

/**
 * Responsive Dashboard Grid Component
 *
 * Provides a flexible grid system that adapts to different screen sizes
 * with smooth animations and customizable layouts.
 *
 * Features:
 * - Responsive column configuration
 * - Smooth animations with stagger effects
 * - Customizable gaps and spacing
 * - Mobile-first approach
 *
 * @example
 * ```tsx
 * <ResponsiveDashboardGrid columns="1:2:3:4" gap="md" animate>
 *   <DashboardCard />
 *   <DashboardCard />
 *   <DashboardCard />
 * </ResponsiveDashboardGrid>
 * ```
 */
export function ResponsiveDashboardGrid({
  children,
  className,
  columns = "1:2:3:4",
  gap = "md",
  animate = true,
  staggerChildren = 0.1,
  delayChildren = 0.2,
}: ResponsiveDashboardGridProps) {
  const [mobile, tablet, desktop, wide] = columns.split(":").map(Number);

  const gridClasses = cn(
    "grid w-full",
    gapClasses[gap],
    // Mobile columns
    mobile === 1 && "grid-cols-1",
    mobile === 2 && "grid-cols-2",
    mobile === 3 && "grid-cols-3",
    mobile === 4 && "grid-cols-4",
    // Tablet columns (md breakpoint)
    tablet === 1 && "md:grid-cols-1",
    tablet === 2 && "md:grid-cols-2",
    tablet === 3 && "md:grid-cols-3",
    tablet === 4 && "md:grid-cols-4",
    tablet === 5 && "md:grid-cols-5",
    tablet === 6 && "md:grid-cols-6",
    // Desktop columns (lg breakpoint)
    desktop === 1 && "lg:grid-cols-1",
    desktop === 2 && "lg:grid-cols-2",
    desktop === 3 && "lg:grid-cols-3",
    desktop === 4 && "lg:grid-cols-4",
    desktop === 5 && "lg:grid-cols-5",
    desktop === 6 && "lg:grid-cols-6",
    // Wide screen columns (xl breakpoint)
    wide === 1 && "xl:grid-cols-1",
    wide === 2 && "xl:grid-cols-2",
    wide === 3 && "xl:grid-cols-3",
    wide === 4 && "xl:grid-cols-4",
    wide === 5 && "xl:grid-cols-5",
    wide === 6 && "xl:grid-cols-6",
    className
  );

  if (animate) {
    return (
      <motion.div
        className={gridClasses}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        custom={{ staggerChildren, delayChildren }}
      >
        {Array.isArray(children)
          ? children.map((child, index) => (
              <motion.div key={index} variants={itemVariants}>
                {child}
              </motion.div>
            ))
          : children}
      </motion.div>
    );
  }

  return <div className={gridClasses}>{children}</div>;
}

/**
 * Enhanced Dashboard Section with responsive layout
 *
 * Features:
 * - Optional loading state with fallback
 * - Error state display
 * - Smooth animations
 * - Responsive header layout
 * - Optional divider
 */
export interface DashboardSectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  animate?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  loadingFallback?: ReactNode;
  showDivider?: boolean;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  animate = true,
  isLoading = false,
  error = null,
  loadingFallback,
  showDivider = false,
}: DashboardSectionProps) {
  // Error display
  if (error) {
    const errorContent = (
      <div className={cn("rounded-lg border border-destructive/50 bg-destructive/10 p-4", className)}>
        <div className="flex gap-3">
          <div className="shrink-0">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              Error loading section
            </p>
            <p className="mt-1 text-xs text-destructive/80">
              {error.message || "An error occurred while loading this section."}
            </p>
          </div>
        </div>
      </div>
    );

    if (animate) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {errorContent}
        </motion.div>
      );
    }
    return errorContent;
  }

  // Loading state
  if (isLoading && loadingFallback) {
    if (animate) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {loadingFallback}
        </motion.div>
      );
    }
    return loadingFallback;
  }

  const content = (
    <>
      <section className={cn("space-y-4 sm:space-y-6", className)}>
        {(title || description || action) && (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              {title && (
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </section>
      {showDivider && <hr className="my-4 sm:my-6 border-border" />}
    </>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

/**
 * Contextual sidebar panel for additional information
 */
export function DashboardSidebar({
  children,
  className,
  position = "right",
}: {
  children: ReactNode;
  className?: string;
  position?: "left" | "right";
}) {
  return (
    <aside
      className={cn(
        "space-y-4 sm:space-y-6",
        position === "right" && "order-last",
        position === "left" && "order-first",
        className
      )}
    >
      {children}
    </aside>
  );
}

/**
 * Main dashboard content area
 */
export function DashboardMainContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex-1 space-y-4 sm:space-y-6", className)}>
      {children}
    </main>
  );
}

/**
 * Dashboard layout with sidebar support
 */
export function DashboardWithSidebar({
  children,
  sidebar,
  sidebarPosition = "right",
  className,
}: {
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: "left" | "right";
  className?: string;
}) {
  if (!sidebar) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8",
        className
      )}
    >
      {sidebarPosition === "left" && sidebar && (
        <DashboardSidebar
          position="left"
          className="xl:col-span-3 order-first xl:order-first"
        >
          {sidebar}
        </DashboardSidebar>
      )}

      <DashboardMainContent
        className={cn(sidebar ? "xl:col-span-9" : "xl:col-span-12")}
      >
        {children}
      </DashboardMainContent>

      {sidebarPosition === "right" && sidebar && (
        <DashboardSidebar
          position="right"
          className="xl:col-span-3 order-last xl:order-last"
        >
          {sidebar}
        </DashboardSidebar>
      )}
    </div>
  );
}
