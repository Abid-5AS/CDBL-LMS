import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardLayoutProps = {
  children: ReactNode;
  className?: string;
  /**
   * Whether to use full-width layout (no max-width constraint)
   * Useful for tables and data-heavy dashboards like dept-head
   */
  fullWidth?: boolean;
  /**
   * Section title (optional)
   */
  title?: string;
  /**
   * Section description (optional)
   */
  description?: string;
};

/**
 * Shared layout wrapper for all dashboard pages
 * Provides consistent padding, margins, and container constraints
 * Material 3 style with responsive grid support
 */
export function DashboardLayout({ 
  children, 
  className,
  fullWidth = false,
  title,
  description,
}: DashboardLayoutProps) {
  return (
    <div
      className={cn(
        "w-full",
        fullWidth 
          ? "px-0" 
          : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
        "py-6",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Responsive grid container for dashboard cards
 * Material 3 style: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
 */
export function DashboardGrid({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6",
        "grid-cols-1",
        "md:grid-cols-2",
        "xl:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section wrapper with title and optional action
 */
export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

