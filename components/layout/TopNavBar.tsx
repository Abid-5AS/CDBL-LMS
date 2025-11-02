"use client";

import Image from "next/image";
import { useUser } from "@/lib/user-context";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ControlCenter from "./ControlCenter";
import { ThemeToggle } from "@/components/theme-toggle";
import clsx from "clsx";

export default function TopNavBar() {
  const user = useUser();
  const pathname = usePathname();
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  // Live notification indicator (can be enhanced with SSE later)
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/latest");
        if (res.ok) {
          const notes = await res.json();
          setHasAlerts(Array.isArray(notes) && notes.length > 0);
        }
      } catch (error) {
        // Silently fail - notifications are optional
      }
    };

    checkNotifications();
    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Page title mapping
  const titles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/leaves/apply": "Apply Leave",
    "/leaves": "My Requests",
    "/approvals": "Approvals",
    "/policies": "Leave Policies",
    "/holidays": "Holidays",
    "/employees": "Employee Directory",
    "/reports": "Analytics & Reports",
    "/settings": "Settings",
    "/balance": "Leave Balance",
    "/manager/dashboard": "Manager Dashboard",
    "/hr-head/dashboard": "HR Head Dashboard",
    "/ceo/dashboard": "Executive Dashboard",
    "/admin": "Admin Console",
    "/admin/audit": "Audit & System Health",
  };

  const title = titles[pathname] ?? "CDBL Leave Management";

  if (!user) return null;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-b border-white/30 dark:border-white/10 shadow-sm"
      role="banner"
    >
      <div className="flex items-center gap-6 w-full px-6">
        {/* Page Title with breadcrumb style */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>CDBL</span>
            <span>/</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h1>
        </div>

        {/* Right Section: Theme Toggle + User Info + Avatar */}
        <div className="flex items-center gap-4 ml-auto">
          <ThemeToggle />

          {/* User Info with better styling */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {user.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {user.role.toLowerCase()}
            </span>
          </div>

          {/* Avatar Button with enhanced styling */}
          <button
            onClick={() => setControlCenterOpen(!controlCenterOpen)}
            aria-label="Open Control Center"
            aria-expanded={controlCenterOpen}
            aria-haspopup="true"
            className={clsx(
              "relative h-10 w-10 rounded-full overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
              controlCenterOpen
                ? "border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/50"
                : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
            )}
          >
            <div className="h-full w-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            {hasAlerts && (
              <span
                className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 animate-pulse"
                aria-label="You have new notifications"
              />
            )}
          </button>

          {/* Control Center Popover */}
          {controlCenterOpen && (
            <div className="relative">
              <ControlCenter onClose={() => setControlCenterOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
