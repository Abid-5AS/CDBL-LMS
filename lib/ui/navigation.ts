import {
  Home,
  ClipboardList,
  BookOpen,
  Users,
  BarChart2,
  ChartBar,
  Shield,
  Activity,
  UserCheck,
  Calendar,
  Wallet,
  PieChart,
  HelpCircle,
  Webhook,
  GitGraph,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/src/generated/prisma/client";

export type UserRole = Role;

export type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
};

// Define role-specific navigation
export const roleNavConfig: Record<UserRole, NavItem[]> = {
  EMPLOYEE: [
    { icon: Home, label: "Home", href: "/dashboard/employee" },
    { icon: ClipboardList, label: "My Leaves", href: "/leaves" },
    { icon: Wallet, label: "Balance", href: "/balance" },
    { icon: Calendar, label: "Holidays", href: "/holidays" },
    { icon: BookOpen, label: "Policies", href: "/policies" },
  ],

  DEPT_HEAD: [
    { icon: Home, label: "Home", href: "/dashboard/dept-head" },
    { icon: Users, label: "Team", href: "/employees" },
    { icon: ClipboardList, label: "Requests", href: "/approvals" },
    { icon: ClipboardList, label: "My Leaves", href: "/leaves" },
    { icon: Wallet, label: "Balance", href: "/balance" },
    { icon: Calendar, label: "Holidays", href: "/holidays" },
    { icon: HelpCircle, label: "FAQ", href: "/faq" },
  ],

  HR_ADMIN: [
    { icon: Home, label: "Home", href: "/dashboard/hr-admin" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: ClipboardList, label: "Requests", href: "/approvals" },
    { icon: ClipboardList, label: "My Leaves", href: "/leaves" },
    { icon: Wallet, label: "Balance", href: "/balance" },
    { icon: ChartBar, label: "Reports", href: "/reports" },
    { icon: Calendar, label: "Holidays", href: "/holidays" },
    { icon: BookOpen, label: "Policies", href: "/policies" },
    { icon: HelpCircle, label: "FAQ", href: "/faq" },
  ],

  HR_HEAD: [
    { icon: Home, label: "Home", href: "/dashboard/hr-head" },
    { icon: ClipboardList, label: "Approvals", href: "/approvals" },
    { icon: ClipboardList, label: "My Leaves", href: "/leaves" },
    { icon: Wallet, label: "Balance", href: "/balance" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: ChartBar, label: "Reports", href: "/reports" },
    { icon: Calendar, label: "Holidays", href: "/holidays" },
    { icon: HelpCircle, label: "FAQ", href: "/faq" },
  ],

  CEO: [
    { icon: Home, label: "Home", href: "/dashboard/ceo" },
    { icon: ClipboardList, label: "Approvals", href: "/approvals" },
    { icon: ChartBar, label: "Reports", href: "/reports" },
    { icon: Shield, label: "Admin", href: "/admin" },
    { icon: GitGraph, label: "Workflows", href: "/dashboard/admin/workflows" },
    { icon: Activity, label: "Audit", href: "/admin/audit" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: Calendar, label: "Holidays", href: "/holidays" },
    { icon: HelpCircle, label: "FAQ", href: "/faq" },
  ],

  SYSTEM_ADMIN: [
    { icon: Home, label: "Home", href: "/dashboard/admin" },
    { icon: ClipboardList, label: "Approvals", href: "/approvals" },
    { icon: ChartBar, label: "Reports", href: "/reports" },
    { icon: Shield, label: "Admin", href: "/admin" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: GitGraph, label: "Workflows", href: "/dashboard/admin/workflows" },
    { icon: Calendar, label: "Holidays", href: "/holidays" },
    { icon: Webhook, label: "Webhooks", href: "/webhooks" },
    { icon: Activity, label: "Audit", href: "/admin/audit" },
    { icon: HelpCircle, label: "FAQ", href: "/faq" },
  ],
};

// Role-specific home pages
export const roleHomePages: Record<UserRole, string> = {
  EMPLOYEE: "/dashboard/employee",
  DEPT_HEAD: "/dashboard/dept-head",
  HR_ADMIN: "/dashboard/hr-admin",
  HR_HEAD: "/dashboard/hr-head",
  CEO: "/dashboard/ceo",
  SYSTEM_ADMIN: "/dashboard/admin",
};

// Get navigation items for a role
export function getNavItemsForRole(role: UserRole): NavItem[] {
  return roleNavConfig[role] || roleNavConfig.EMPLOYEE;
}

// Get home page for a role
export function getHomePageForRole(role: UserRole): string {
  return roleHomePages[role] || "/dashboard";
}
