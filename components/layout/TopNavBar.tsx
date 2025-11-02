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
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-white/60 backdrop-blur-md shadow-sm px-6"
      role="banner"
    >
      {/* Page Title */}
      <h1 className="text-sm font-semibold text-indigo-600">{title}</h1>

      {/* Right Section: Theme Toggle + User Info + Avatar */}
      <div className="flex items-center gap-3 relative">
        <ThemeToggle />
        <span className="hidden sm:block text-sm text-gray-600">{user.name}</span>

        {/* Avatar Button */}
        <button
          onClick={() => setControlCenterOpen(!controlCenterOpen)}
          aria-label="Open Control Center"
          aria-expanded={controlCenterOpen}
          aria-haspopup="true"
          className={clsx(
            "relative h-8 w-8 rounded-full overflow-hidden border border-gray-200 hover:ring-2 hover:ring-indigo-300 transition-all",
            controlCenterOpen && "ring-2 ring-indigo-500"
          )}
        >
          <div className="h-full w-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          {hasAlerts && (
            <span
              className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
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
    </header>
  );
}

