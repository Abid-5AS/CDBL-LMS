"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/ui/navigation";
import type { UserRole } from "@/lib/ui/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "./SidebarContext";

type AdminSidebarProps = {
  navItems: NavItem[];
  role: UserRole;
};

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard")
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (href === "/admin")
    return pathname === "/admin" || pathname.startsWith("/admin/");
  if (href === "/reports") return pathname === "/reports" || pathname.startsWith("/reports/");
  if (href === "/employees") return pathname === "/employees" || pathname.startsWith("/employees/");
  if (href === "/approvals") return pathname === "/approvals" || pathname.startsWith("/approvals/");
  if (href === "/policies") return pathname === "/policies" || pathname.startsWith("/policies/");
  if (href === "/leaves") return pathname === "/leaves" || pathname.startsWith("/leaves/");
  if (href === "/webhooks") return pathname === "/webhooks" || pathname.startsWith("/webhooks/");
  if (href.startsWith("/dashboard/")) {
    const topLevel = ["/reports", "/employees", "/approvals", "/policies", "/leaves"];
    return pathname.startsWith(href) && !topLevel.some((r) => pathname.startsWith(r));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ navItems, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const collapsed = sidebar?.collapsed ?? false;

  return (
    <aside
      className={cn(
        "fixed left-0 top-[72px] bottom-0 z-40 hidden md:flex flex-col border-r border-border bg-background/95 backdrop-blur-sm transition-all duration-200",
        collapsed ? "w-16" : "w-[240px]"
      )}
      aria-label="Admin navigation"
    >
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge != null && item.badge > 0 && (
                    <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => sidebar?.toggle()}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
