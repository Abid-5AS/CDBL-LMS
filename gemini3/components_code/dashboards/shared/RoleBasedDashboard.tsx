"use client";

import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import type { Role } from "@prisma/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RoleBasedDashboardProps = {
  children: ReactNode;
  role: Role;
  className?: string;
  /**
   * Whether to use full-width layout (no max-width constraint)
   * Useful for data-heavy dashboards like dept-head and hr-admin
   */
  fullWidth?: boolean;
  /**
   * Dashboard title
   */
  title?: string;
  /**
   * Dashboard description
   */
  description?: string;
  /**
   * Optional action buttons/controls in the header
   */
  actions?: ReactNode;
  /**
   * Animation configuration
   */
  animate?: boolean;
  /**
   * Background style variant
   */
  backgroundVariant?: "gradient" | "solid" | "transparent";
};

// Role-specific styling configurations
const roleConfigs = {
  EMPLOYEE: {
    accent: "var(--role-employee-accent, #6366f1)", // Indigo
    accentSoft: "var(--role-employee-accent-soft, #eef2ff)",
    gradient:
      "from-indigo-50 via-blue-50/30 to-purple-50/50 dark:from-slate-900 dark:via-indigo-900/20 dark:to-slate-900",
    maxWidth: "max-w-7xl",
    padding: "px-4 sm:px-6 lg:px-8",
  },
  MANAGER: {
    accent: "var(--role-manager-accent, #059669)", // Emerald
    accentSoft: "var(--role-manager-accent-soft, #ecfdf5)",
    gradient:
      "from-emerald-50 via-green-50/30 to-teal-50/50 dark:from-slate-900 dark:via-emerald-900/20 dark:to-slate-900",
    maxWidth: "max-w-7xl",
    padding: "px-4 sm:px-6 lg:px-8",
  },
  DEPT_HEAD: {
    accent: "var(--role-dept-head-accent, #dc2626)", // Red
    accentSoft: "var(--role-dept-head-accent-soft, #fef2f2)",
    gradient:
      "from-red-50 via-orange-50/30 to-pink-50/50 dark:from-slate-900 dark:via-red-900/20 dark:to-slate-900",
    maxWidth: "max-w-[1600px]", // Wider for data tables
    padding: "px-3 sm:px-4 lg:px-6",
  },
  HR_ADMIN: {
    accent: "var(--role-hr-admin-accent, #7c3aed)", // Violet
    accentSoft: "var(--role-hr-admin-accent-soft, #f3f4f6)",
    gradient:
      "from-violet-50 via-purple-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-violet-900/20 dark:to-slate-900",
    maxWidth: "max-w-[1600px]", // Wider for HR data
    padding: "px-3 sm:px-4 lg:px-6",
  },
  HR_HEAD: {
    accent: "var(--role-hr-head-accent, #ea580c)", // Orange
    accentSoft: "var(--role-hr-head-accent-soft, #fff7ed)",
    gradient:
      "from-orange-50 via-amber-50/30 to-yellow-50/50 dark:from-slate-900 dark:via-orange-900/20 dark:to-slate-900",
    maxWidth: "max-w-[1600px]", // Wider for executive view
    padding: "px-3 sm:px-4 lg:px-6",
  },
  CEO: {
    accent: "var(--role-ceo-accent, #1f2937)", // Gray
    accentSoft: "var(--role-ceo-accent-soft, #f9fafb)",
    gradient:
      "from-slate-50 via-gray-50/30 to-zinc-50/50 dark:from-slate-900 dark:via-gray-900/20 dark:to-slate-900",
    maxWidth: "max-w-[1800px]", // Widest for executive dashboard
    padding: "px-3 sm:px-4 lg:px-6",
  },
  SYSTEM_ADMIN: {
    accent: "var(--role-system-admin-accent, #0891b2)", // Cyan
    accentSoft: "var(--role-system-admin-accent-soft, #ecfeff)",
    gradient:
      "from-cyan-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-cyan-900/20 dark:to-slate-900",
    maxWidth: "max-w-[1600px]", // Wide for system data
    padding: "px-3 sm:px-4 lg:px-6",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

/**
 * Role-Based Dashboard Layout Component
 *
 * Provides role-specific styling, layouts, and responsive behavior
 * tailored to different user roles and their specific needs.
 *
 * Features:
 * - Role-specific color schemes and gradients
 * - Adaptive container widths based on role requirements
 * - Responsive padding and spacing
 * - Smooth animations with role-appropriate timing
 * - Progressive disclosure for complex data
 *
 * @example
 * ```tsx
 * <RoleBasedDashboard
 *   role="EMPLOYEE"
 *   title="Employee Dashboard"
 *   description="Manage your leave requests and view balances"
 * >
 *   <DashboardContent />
 * </RoleBasedDashboard>
 * ```
 */
export function RoleBasedDashboard({
  children,
  role,
  className,
  fullWidth = false,
  title,
  description,
  actions,
  animate = true,
  backgroundVariant = "gradient",
}: RoleBasedDashboardProps) {
  const config = roleConfigs[role] || roleConfigs.EMPLOYEE;

  const backgroundClass =
    backgroundVariant === "solid"
      ? "bg-background"
      : backgroundVariant === "transparent"
      ? ""
      : cn("bg-gradient-to-br", config.gradient);

  const containerClasses = cn("min-h-screen", backgroundClass, className);

  const contentClasses = cn(
    "container mx-auto",
    title || description || actions
      ? "py-6 sm:py-8 lg:py-10"
      : "py-3 sm:py-4 lg:py-6",
    fullWidth ? "px-0" : config.padding,
    !fullWidth && config.maxWidth
  );

  const content = (
    <div
      className={containerClasses}
      style={
        {
          // @ts-ignore - CSS custom properties
          "--dashboard-accent": config.accent,
          "--dashboard-accent-soft": config.accentSoft,
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <div className={contentClasses}>
        {/* Header Section */}
        {(title || description || actions) && (
          <div
            className={cn(
              "mb-6 sm:mb-8 lg:mb-10",
              !title && !description && actions && "mb-4"
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-4",
                actions && !title && !description && "justify-end",
                actions &&
                  (title || description) &&
                  "sm:flex-row sm:items-start sm:justify-between"
              )}
            >
              {(title || description) && (
                <div className="flex-1">
                  {title && (
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {actions && (
                <div className="shrink-0 flex flex-wrap gap-2 sm:gap-3 ml-auto">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        {animate ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </div>
    </div>
  );

  return content;
}

/**
 * Role-specific dashboard card with accent styling
 */
export function RoleDashboardCard({
  children,
  className,
  role,
  variant = "default",
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  role?: Role;
  variant?: "default" | "accent" | "glass";
  animate?: boolean;
}) {
  const config = role
    ? roleConfigs[role] || roleConfigs.EMPLOYEE
    : roleConfigs.EMPLOYEE;

  const cardClasses = cn(
    "rounded-xl border shadow-sm transition-all duration-300 h-full",
    variant === "default" && "bg-card border-border hover:shadow-md",
    variant === "accent" && [
      "border-[color:var(--dashboard-accent)]/20",
      "bg-gradient-to-br from-[color:var(--dashboard-accent-soft)] to-card",
      "hover:shadow-lg hover:shadow-[color:var(--dashboard-accent)]/10",
    ],
    variant === "glass" && ["glass-card", "hover:shadow-xl"],
    className
  );

  const content = (
    <div className={cardClasses} suppressHydrationWarning>
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        suppressHydrationWarning
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

/**
 * Role-specific KPI card with enhanced styling
 */
export function RoleKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  role,
  className,
  animate = true,
  onClick,
  clickLabel,
  tooltip,
}: {
  title: string | ReactNode;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  role?: Role;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
  clickLabel?: string;
  tooltip?: string;
}) {
  const config = role
    ? roleConfigs[role] || roleConfigs.EMPLOYEE
    : roleConfigs.EMPLOYEE;

  const accentVars: CSSProperties & {
    "--role-kpi-accent"?: string;
    "--role-kpi-accent-soft"?: string;
    "--role-kpi-accent-muted"?: string;
  } = {
    "--role-kpi-accent": config.accent,
    "--role-kpi-accent-soft": config.accentSoft,
    "--role-kpi-accent-muted":
      "color-mix(in srgb, var(--role-kpi-accent) 8%, transparent)",
  };

  const trendGlyph = trend ? (
    trend.direction === "up" ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : trend.direction === "down" ? (
      <TrendingDown className="h-3.5 w-3.5" />
    ) : (
      <Minus className="h-3.5 w-3.5" />
    )
  ) : null;

  const content = (
    <div
      className={cn(
        "neo-card group relative flex h-full min-h-[190px] flex-col overflow-hidden",
        "px-5 py-5 sm:px-6 sm:py-6",
        onClick &&
          "cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      style={accentVars}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      title={onClick && clickLabel ? clickLabel : undefined}
      aria-label={onClick && clickLabel ? clickLabel : undefined}
    >
      {/* Removed gradient effect for professional look */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--color-foreground-subtle)]">
            {title}
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      className="cursor-help rounded-full p-0.5 hover:bg-muted/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="h-3 w-3 opacity-70" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground sm:text-4xl">
              {value}
            </p>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          {trend && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--role-kpi-accent-soft)]/70 px-3 py-1 text-xs font-semibold text-[color:var(--role-kpi-accent)]">
              {trendGlyph}
              <span>
                {trend.direction === "down"
                  ? "-"
                  : trend.direction === "up"
                  ? "+"
                  : ""}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-[color:var(--color-foreground-subtle)]/80">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="rounded-xl border border-border/50 p-3 bg-accent/10"
            style={{
              color: "var(--role-kpi-accent)",
            }}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
