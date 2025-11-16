import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { getRoleAccentColor, getRoleSoftColor } from "@/constants/colors";

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
  const accentColor = role ? getRoleAccentColor(role) : undefined;
  const accentSoft = role ? getRoleSoftColor(role) : undefined;
  const formattedRole = role
    ? role
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : undefined;

  return (
    <div className={cn("page-stack", className)}>
      {(title || description || actions) && (
        <section
          className={cn(
            "page-section space-y-5",
            fullWidth && "page-section--wide"
          )}
        >
          <div className="page-section__header flex-col gap-4 md:flex-row">
            <div className="flex-1 space-y-4">
              {formattedRole && (
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-[0.3em] uppercase"
                  style={
                    {
                      backgroundColor: accentSoft,
                      color: accentColor,
                    } as CSSProperties
                  }
                >
                  {formattedRole}
                </span>
              )}
              {title && (
                <h1 className="page-shell__title">
                  {title}
                </h1>
              )}
              {description && (
                <p className="page-shell__subtitle text-base">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="page-shell__actions md:justify-end">
                {actions}
              </div>
            )}
          </div>
        </section>
      )}

      <div className={cn("page-stack", fullWidth && "page-section--wide")}>{children}</div>
    </div>
  );
}

/**
 * Responsive grid container for dashboard cards
 * Material 3 style: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
 */
export function DashboardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("stats-grid", className)}>{children}</div>
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
    <section className={cn("page-section space-y-4", className)}>
      {(title || description || action) && (
        <div className="page-section__header">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action && <div className="page-section__actions">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
