import clsx from "clsx";
import Link from "next/link";
import type { ComponentType } from "react";
import { BarChart3, CalendarDays, CalendarPlus, ClipboardCheck, FileText, LifeBuoy, Settings, ShieldCheck, Users, House } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

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

const HR_ADMIN_LINKS: SidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/holidays", label: "Holidays", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: LifeBuoy },
];

const SUPER_ADMIN_LINKS: SidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/admin", label: "Admin Console", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/help", label: "Help", icon: LifeBuoy },
];

function resolveLinks(role: string | null | undefined) {
  if (role === "HR_ADMIN") return HR_ADMIN_LINKS;
  if (role === "SUPER_ADMIN") return SUPER_ADMIN_LINKS;
  return EMPLOYEE_LINKS;
}

function isActive(href: string, pathname: string) {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export async function Sidebar({ pathname }: { pathname: string }) {
  const user = await getCurrentUser();
  const links = resolveLinks(user?.role);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6">
      <div className="text-lg font-semibold text-slate-900">CDBL Leave</div>
      <nav className="mt-6 flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-2 rounded-md px-3 py-2 transition",
                active
                  ? "border-l-4 border-blue-600 bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto text-xs text-slate-400">Signed in as {user?.name ?? "Employee"}</div>
    </aside>
  );
}
