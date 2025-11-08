"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Role } from "@prisma/client";

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
      ease: [0.22, 1, 0.36, 1],
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
    "container mx-auto py-6 sm:py-8 lg:py-10",
    fullWidth ? "px-0" : config.padding,
    !fullWidth && config.maxWidth
  );

  const content = (
    <div className={containerClasses}>
      {/* Role-specific CSS custom properties */}
      <style jsx global>{`
        :global(:root) {
          --dashboard-accent: ${config.accent};
          --dashboard-accent-soft: ${config.accentSoft};
        }
      `}</style>

      <div className={contentClasses}>
        {/* Header Section */}
        {(title || description || actions) && (
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <div
              className={cn(
                "flex flex-col gap-4",
                actions && "sm:flex-row sm:items-start sm:justify-between"
              )}
            >
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
              {actions && (
                <div className="shrink-0 flex flex-wrap gap-2 sm:gap-3">
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
    "rounded-xl border shadow-sm transition-all duration-300",
    variant === "default" && "bg-card border-border hover:shadow-md",
    variant === "accent" && [
      "border-[color:var(--dashboard-accent)]/20",
      "bg-gradient-to-br from-[color:var(--dashboard-accent-soft)] to-card",
      "hover:shadow-lg hover:shadow-[color:var(--dashboard-accent)]/10",
    ],
    variant === "glass" && [
      "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl",
      "border-white/20 dark:border-slate-700/50",
      "shadow-xl hover:shadow-2xl",
    ],
    className
  );

  const content = <div className={cardClasses}>{children}</div>;

  if (animate) {
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
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
}: {
  title: string;
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
}) {
  const config = role
    ? roleConfigs[role] || roleConfigs.EMPLOYEE
    : roleConfigs.EMPLOYEE;

  const content = (
    <RoleDashboardCard
      role={role}
      variant="glass"
      className={cn("p-4 sm:p-6", className)}
      animate={false}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "up" &&
                    "text-green-600 dark:text-green-400",
                  trend.direction === "down" &&
                    "text-red-600 dark:text-red-400",
                  trend.direction === "neutral" && "text-muted-foreground"
                )}
              >
                {trend.direction === "up" && "↗"}
                {trend.direction === "down" && "↘"}
                {trend.direction === "neutral" && "→"}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="p-2 sm:p-3 rounded-xl"
            style={{
              backgroundColor: config.accentSoft,
            }}
          >
            <Icon
              className="w-5 h-5 sm:w-6 sm:h-6"
              style={{ color: config.accent }}
            />
          </div>
        )}
      </div>
    </RoleDashboardCard>
  );

  if (animate) {
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
