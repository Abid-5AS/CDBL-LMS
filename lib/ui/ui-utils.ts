/**
 * UI Utility Functions
 * Shared utilities for consistent UI styling across the application
 */

import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Crown,
  ShieldCheck,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";

export type AppRole =
  | "EMPLOYEE"
  | "DEPT_HEAD"
  | "HR_ADMIN"
  | "HR_HEAD"
  | "CEO"
  | "SYSTEM_ADMIN";

/**
 * Get consistent role badge CSS classes based on role
 * Uses role-specific CSS variables for theming
 */
export function getRoleBadgeClasses(role: AppRole): string {
  const roleConfigs: Record<AppRole, string> = {
    CEO: "bg-muted/50 text-foreground border-muted",
    HR_HEAD: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    HR_ADMIN: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    DEPT_HEAD: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    EMPLOYEE: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    SYSTEM_ADMIN: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  };

  return roleConfigs[role] || roleConfigs.EMPLOYEE;
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    CEO: "CEO",
    HR_HEAD: "HR Head",
    HR_ADMIN: "HR Admin",
    DEPT_HEAD: "Manager",
    EMPLOYEE: "Employee",
    SYSTEM_ADMIN: "System Admin",
  };

  return labels[role] || role;
}

/**
 * Get role icon for visual distinction
 */
export function getRoleIcon(role: AppRole): LucideIcon {
  const icons: Record<AppRole, LucideIcon> = {
    CEO: Crown,
    HR_HEAD: Target,
    HR_ADMIN: ClipboardList,
    DEPT_HEAD: UsersRound,
    EMPLOYEE: UserRound,
    SYSTEM_ADMIN: ShieldCheck,
  };

  return icons[role] || UserRound;
}
