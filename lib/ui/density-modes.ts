/**
 * Density Mode Utilities - Corporate Design System
 *
 * Implements the two density modes from the UI/UX Master Plan:
 *
 * 1. COMFORTABLE - For Employee, CEO roles
 *    - More whitespace, larger cards
 *    - Focus on readability and high-level insights
 *
 * 2. COMPACT - For HR Admin, Dept Head, System Admin roles
 *    - Data-heavy views
 *    - Minimize scrolling
 *    - Dense tables and efficient layouts
 */

import type { AppRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export type DensityMode = "comfortable" | "compact";

/**
 * Map roles to their default density mode
 */
export const ROLE_DENSITY_MAP: Record<AppRole, DensityMode> = {
  EMPLOYEE: "comfortable",
  CEO: "comfortable",
  DEPT_HEAD: "compact",
  HR_ADMIN: "compact",
  HR_HEAD: "compact",
  SYSTEM_ADMIN: "compact",
};

/**
 * Get default density mode for a role
 */
export function getDensityForRole(role: AppRole): DensityMode {
  return ROLE_DENSITY_MAP[role] || "comfortable";
}

/**
 * Density-aware class generators
 */

/**
 * Card padding based on density
 */
export function cardPadding(density: DensityMode = "comfortable"): string {
  return density === "comfortable" ? "p-6" : "p-4";
}

/**
 * Card gap (space between elements inside card)
 */
export function cardGap(density: DensityMode = "comfortable"): string {
  return density === "comfortable" ? "gap-4" : "gap-3";
}

/**
 * Section spacing (space between major sections)
 */
export function sectionSpacing(density: DensityMode = "comfortable"): string {
  return density === "comfortable" ? "space-y-6" : "space-y-4";
}

/**
 * Text size for body content
 */
export function bodyText(density: DensityMode = "comfortable"): string {
  return density === "comfortable" ? "text-base" : "text-sm";
}

/**
 * Table row padding
 */
export function tableRowPadding(density: DensityMode = "comfortable"): string {
  return density === "comfortable" ? "py-4" : "py-2";
}

/**
 * Table cell padding
 */
export function tableCellPadding(density: DensityMode = "comfortable"): string {
  return density === "comfortable" ? "px-5 py-4" : "px-4 py-2";
}

/**
 * Button size based on density
 */
export function buttonSize(density: DensityMode = "comfortable"): "default" | "sm" {
  return density === "comfortable" ? "default" : "sm";
}

/**
 * Complete density class set for quick application
 */
export interface DensityClasses {
  card: string;
  cardPadding: string;
  cardGap: string;
  section: string;
  text: string;
  tableRow: string;
  tableCell: string;
  button: "default" | "sm";
}

export function getDensityClasses(density: DensityMode = "comfortable"): DensityClasses {
  return {
    card: cn(
      "bg-card border border-border shadow-sm rounded-md",
      cardPadding(density),
      cardGap(density)
    ),
    cardPadding: cardPadding(density),
    cardGap: cardGap(density),
    section: sectionSpacing(density),
    text: bodyText(density),
    tableRow: tableRowPadding(density),
    tableCell: tableCellPadding(density),
    button: buttonSize(density),
  };
}

/**
 * Grid layout configurations by density
 */
export const GRID_CONFIGS = {
  comfortable: {
    // Employee Dashboard: 2-column (2/3 Main, 1/3 Status)
    employeeDashboard: "grid grid-cols-1 lg:grid-cols-3 gap-6",
    employeeMain: "lg:col-span-2",
    employeeSidebar: "lg:col-span-1",

    // CEO Dashboard: Single page executive view
    ceoDashboard: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  },
  compact: {
    // Manager Dashboard: 3-column (Team Status, Approvals, Calendar)
    managerDashboard: "grid grid-cols-1 lg:grid-cols-3 gap-4",
    managerLeft: "lg:col-span-1",
    managerMid: "lg:col-span-1",
    managerRight: "lg:col-span-1",

    // HR Admin: Less visual, more functional
    hrAdminDashboard: "grid grid-cols-1 gap-4",
    hrAdminStatsRow: "grid grid-cols-1 sm:grid-cols-3 gap-3",
    hrAdminMain: "col-span-1",

    // HR Head: Analytical dashboard
    hrHeadDashboard: "grid grid-cols-1 lg:grid-cols-3 gap-4",
    hrHeadTopRow: "lg:col-span-3",
    hrHeadLeft: "lg:col-span-2",
    hrHeadRight: "lg:col-span-1",
  },
};

/**
 * Typography scales by density
 */
export const TYPOGRAPHY = {
  comfortable: {
    pageTitle: "text-3xl font-bold text-foreground",
    sectionTitle: "text-xl font-semibold text-foreground",
    cardTitle: "text-lg font-semibold text-foreground",
    body: "text-base text-foreground",
    label: "text-sm font-medium text-muted-foreground uppercase tracking-wide",
    kpiNumber: "text-4xl font-bold text-foreground",
  },
  compact: {
    pageTitle: "text-2xl font-bold text-foreground",
    sectionTitle: "text-lg font-semibold text-foreground",
    cardTitle: "text-base font-semibold text-foreground",
    body: "text-sm text-foreground",
    label: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
    kpiNumber: "text-3xl font-bold text-foreground",
  },
};

/**
 * Get typography classes for density mode
 */
export function getTypography(density: DensityMode = "comfortable") {
  return TYPOGRAPHY[density];
}

/**
 * Status badge styling (consistent across all densities)
 */
export const STATUS_BADGE_STYLES = {
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  SUBMITTED: "bg-blue-50 text-blue-700 border border-blue-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
  CANCELLED: "bg-slate-50 text-slate-700 border border-slate-200",
  RETURNED: "bg-purple-50 text-purple-700 border border-purple-200",
  CANCELLATION_REQUESTED: "bg-orange-50 text-orange-700 border border-orange-200",
  DRAFT: "bg-slate-50 text-slate-500 border border-slate-200",
};

/**
 * Get status badge classes
 */
export function statusBadgeClass(
  status: keyof typeof STATUS_BADGE_STYLES,
  density: DensityMode = "comfortable"
): string {
  const baseClasses = "inline-flex items-center rounded-md font-medium";
  const sizeClasses = density === "comfortable" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  const colorClasses = STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.DRAFT;

  return cn(baseClasses, sizeClasses, colorClasses);
}

/**
 * Leave type color indicators (top border on cards)
 */
export const LEAVE_TYPE_COLORS = {
  EARNED: "border-t-blue-500",
  CASUAL: "border-t-green-500",
  MEDICAL: "border-t-red-500",
  MATERNITY: "border-t-pink-500",
  PATERNITY: "border-t-indigo-500",
  STUDY: "border-t-purple-500",
  SPECIAL: "border-t-yellow-500",
  SPECIAL_DISABILITY: "border-t-orange-500",
  QUARANTINE: "border-t-teal-500",
  EXTRAWITHPAY: "border-t-cyan-500",
  EXTRAWITHOUTPAY: "border-t-gray-500",
};

/**
 * Get leave type indicator class (colored top border)
 */
export function leaveTypeIndicator(type: keyof typeof LEAVE_TYPE_COLORS): string {
  return cn("border-t-4", LEAVE_TYPE_COLORS[type] || "border-t-slate-500");
}

/**
 * Metric card variants (for KPI displays)
 * Theme-aware: Uses CSS variables for background and border
 */
export function metricCard(density: DensityMode = "comfortable"): string {
  const base = "bg-card border border-border rounded-md shadow-sm";
  const padding = density === "comfortable" ? "p-6" : "p-4";
  return cn(base, padding);
}

/**
 * Quick action button styling (consistent corporate)
 * Theme-aware: Uses primary color
 */
export function quickActionButton(density: DensityMode = "comfortable"): string {
  const base = "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-all duration-100";
  const size = density === "comfortable" ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-sm";
  return cn(base, size);
}

/**
 * Icon sizes by density
 */
export const ICON_SIZES = {
  comfortable: {
    xs: "size-4",
    sm: "size-5",
    md: "size-6",
    lg: "size-8",
    xl: "size-10",
  },
  compact: {
    xs: "size-3",
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
    xl: "size-8",
  },
};

/**
 * Get icon size class
 */
export function iconSize(size: keyof typeof ICON_SIZES.comfortable, density: DensityMode = "comfortable"): string {
  return ICON_SIZES[density][size];
}

/**
 * React component prop helper for density-aware components
 */
export interface DensityAwareProps {
  density?: DensityMode;
  className?: string;
}

/**
 * Apply density-aware classes to a component
 */
export function withDensity<T extends DensityAwareProps>(
  props: T,
  baseClasses: (density: DensityMode) => string
): string {
  const density = props.density || "comfortable";
  return cn(baseClasses(density), props.className);
}
