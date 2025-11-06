import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

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
  /**
   * User role for role-specific styling
   */
  role?: Role;
  /**
   * Optional action buttons/controls in the header
   */
  actions?: ReactNode;
};

/**
 * Enhanced Dashboard Layout Component
 * Provides consistent padding, margins, and container constraints
 * Material 3 style with responsive grid support
 * Supports role-specific styling and header actions
 */
export function DashboardLayout({
  children,
  className,
  fullWidth = false,
  title,
  description,
  role,
  actions,
}: DashboardLayoutProps) {
  // Role-specific styling classes
  const roleClasses = {
    EMPLOYEE: "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20",
    DEPT_HEAD: "bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20",
    HR_ADMIN: "bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20",
    HR_HEAD: "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20",
    CEO: "bg-gradient-to-br from-rose-50/50 to-red-50/50 dark:from-rose-950/20 dark:to-red-950/20",
    SYSTEM_ADMIN: "bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20",
  };

  return (
    <div
      className={cn(
        "w-full min-h-screen",
        role && roleClasses[role],
        className
      )}
    >
      <div
        className={cn(
          fullWidth ? "px-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
          "py-6"
        )}
      >
        {(title || description || actions) && (
          <div className={cn("mb-6", actions && "flex items-start justify-between gap-4")}>
            <div className="flex-1">
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </div>
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

