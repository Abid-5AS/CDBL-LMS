/**
 * @deprecated Legacy sidebar navigation component
 * This component provided role-based sidebar links
 * Use FloatingDock component with lib/navigation.ts config instead
 * This is preserved only for reference - do not use in new code
 */

import clsx from "clsx";
import Link from "next/link";
import type { ComponentType } from "react";
import { BarChart3, CalendarDays, CalendarPlus, ClipboardCheck, FileText, LifeBuoy, Settings, ShieldCheck, Users, House, UserCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

type SidebarLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const EMPLOYEE_LINKS: SidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/leaves", label: "My Requests", icon: ClipboardCheck },
  { href: "/leaves/apply", label: "Apply Leave", icon: CalendarPlus },
  { href: "/holidays", label: "Holidays", icon: CalendarDays },
  { href: "/policies", label: "Policies", icon: FileText },
  { href: "/help", label: "Help", icon: LifeBuoy },
];

const DEPT_HEAD_LINKS: SidebarLink[] = [
  { href: "/manager/dashboard", label: "Dashboard", icon: House },
  { href: "/approvals", label: "Approvals", icon: UserCheck },
  { href: "/employees", label: "Team", icon: Users },
  { href: "/holidays", label: "Holidays", icon: CalendarDays },
  { href: "/policies", label: "Policies", icon: FileText },
  { href: "/help", label: "Help", icon: LifeBuoy },
];

const HR_ADMIN_LINKS: SidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/holidays", label: "Holidays", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: LifeBuoy },
];

const HR_HEAD_LINKS: SidebarLink[] = [
  { href: "/hr-head/dashboard", label: "Dashboard", icon: House },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/reports", label: "Analytics", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: LifeBuoy },
];

const CEO_LINKS: SidebarLink[] = [
  { href: "/ceo/dashboard", label: "Dashboard", icon: House },
  { href: "/approvals", label: "Executive Approvals", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin", label: "Admin Console", icon: ShieldCheck },
  { href: "/help", label: "Help", icon: LifeBuoy },
];

function resolveLinks(role: string | null | undefined) {
  if (role === "DEPT_HEAD") return DEPT_HEAD_LINKS;
  if (role === "HR_ADMIN") return HR_ADMIN_LINKS;
  if (role === "HR_HEAD") return HR_HEAD_LINKS;
  if (role === "CEO") return CEO_LINKS;
  return EMPLOYEE_LINKS;
}

function getRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "HR_ADMIN":
      return "HR Admin";
    case "HR_HEAD":
      return "HR Head";
    case "DEPT_HEAD":
      return "Manager";
    case "CEO":
      return "CEO";
    default:
      return "Employee";
  }
}

function isActive(href: string, pathname: string, allLinks: SidebarLink[]) {
  // Exact match
  if (pathname === href) return true;
  
  // Don't highlight parent routes if a child route is active
  // Check if any link in the sidebar is an exact match first
  const hasExactMatch = allLinks.some(link => pathname === link.href);
  if (hasExactMatch && pathname !== href) {
    return false;
  }
  
  // Prefix match for parent routes (only if no exact match exists)
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  
  return false;
}

export async function Sidebar({ pathname }: { pathname: string }) {
  const user = await getCurrentUser();
  const links = resolveLinks(user?.role);

  return (
    <aside className="hidden lg:flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm" aria-label="Main navigation">
      {/* Logo/Brand */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">CDBL</div>
          <div className="text-xs text-slate-500">Leave Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href, pathname, links);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                active
                  ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className={clsx("h-4 w-4 flex-shrink-0", active && "text-blue-600")} aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-200 px-3 py-4 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-blue-700">
              {(user?.name ?? "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-900 truncate">
              {user?.name ?? "Employee"}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {getRoleLabel(user?.role)}
            </div>
          </div>
        </div>
        <LogoutButton className="w-full justify-start px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100" />
      </div>
    </aside>
  );
}
