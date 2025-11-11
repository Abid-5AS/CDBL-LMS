import {
  Home,
  FileText,
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@prisma/client";

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
    { icon: FileText, label: "Apply", href: "/leaves/apply" },
    { icon: ClipboardList, label: "My Leaves", href: "/leaves" },
    { icon: Wallet, label: "Balance", href: "/balance" },
    { icon: BookOpen, label: "Policies", href: "/policies" },
    { icon: Calendar, label: "Holidays", href: "/holidays" },
  ],

  DEPT_HEAD: [
    { icon: Home, label: "Home", href: "/dashboard/dept-head" },
    { icon: ClipboardList, label: "Requests", href: "/approvals" },
    { icon: Users, label: "Team", href: "/employees" },
  ],

  HR_ADMIN: [
    { icon: Home, label: "Home", href: "/dashboard/hr-admin" },
    { icon: ClipboardList, label: "Requests", href: "/approvals" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: ChartBar, label: "Reports", href: "/reports" },
    { icon: BookOpen, label: "Policies", href: "/policies" },
  ],

  HR_HEAD: [
    { icon: Home, label: "Home", href: "/dashboard/hr-head" },
    { icon: ClipboardList, label: "Approvals", href: "/approvals" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: ChartBar, label: "Reports", href: "/reports" },
    { icon: Activity, label: "Audit", href: "/admin/audit" },
  ],

  CEO: [
    { icon: Home, label: "Home", href: "/dashboard/ceo" },
    { icon: ChartBar, label: "Reports", href: "/reports" },
    { icon: Shield, label: "Admin", href: "/admin" },
    { icon: Activity, label: "Audit", href: "/admin/audit" },
    { icon: Users, label: "Employees", href: "/employees" },
  ],

  SYSTEM_ADMIN: [
    { icon: Home, label: "Home", href: "/dashboard/admin" },
    { icon: ChartBar, label: "Reports", href: "/reports" },
    { icon: Shield, label: "Admin", href: "/admin" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: Activity, label: "Audit", href: "/admin/audit" },
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
