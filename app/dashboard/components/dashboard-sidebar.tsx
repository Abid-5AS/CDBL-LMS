import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Book,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  Gift,
  HelpCircle,
  Home,
  Settings,
  Users,
} from "lucide-react";
import type { AppRole } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/auth";

type DashboardSidebarProps = {
  activeItem?: string;
};

type SidebarLink = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

const employeeLinks: SidebarLink[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
  { key: "apply-leave", label: "Apply Leave", href: "/leaves/apply", icon: Calendar },
  { key: "my-requests", label: "My Requests", href: "/leaves", icon: ClipboardList },
  { key: "balance-policy", label: "Balance & Policy", href: "/leaves/balance", icon: Book },
  { key: "holidays", label: "Holidays", href: "/holidays", icon: Gift },
  { key: "help", label: "Help", href: "/help", icon: HelpCircle },
];

const hrAdminLinks: SidebarLink[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
  { key: "approvals", label: "Approvals", href: "/approvals", icon: ClipboardCheck },
  { key: "employees", label: "Employees", href: "/employees", icon: Users },
  { key: "holidays", label: "Holidays", href: "/holidays", icon: Gift },
  { key: "reports", label: "Reports", href: "/reports", icon: BarChart3 },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
  { key: "help", label: "Help", href: "/help", icon: HelpCircle },
];

async function getApprovalsCount() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const endpoint = baseUrl && baseUrl.length > 0 ? `${baseUrl}/api/approvals` : "/api/approvals";
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data.items) ? data.items.length : 0;
  } catch {
    return 0;
  }
}

export async function DashboardSidebar({ activeItem }: DashboardSidebarProps) {
  const user = await getCurrentUser();
  const role = user?.role as AppRole | undefined;
  const isHrAdmin = role === "HR_ADMIN";
  const approvalsCount = isHrAdmin ? await getApprovalsCount() : 0;

  const links: SidebarLink[] = (isHrAdmin ? hrAdminLinks : employeeLinks).map((link) =>
    isHrAdmin && link.key === "approvals" ? { ...link, badge: approvalsCount } : link
  );

  return (
    <aside className="w-64 bg-white border-r">
      <nav className="p-6 space-y-2">
        {links.map((link) => {
          const isActive = activeItem === link.key;
          const Icon = link.icon;
          return (
            <Link
              key={link.key}
              href={link.href}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition ${
                isActive
                  ? "font-semibold bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{link.label}</span>
              {typeof link.badge === "number" && (
                <span className="inline-flex min-w-6 justify-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
