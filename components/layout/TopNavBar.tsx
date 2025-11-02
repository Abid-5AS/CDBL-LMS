"use client";

import { useUser } from "@/lib/user-context";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import ControlCenter from "./ControlCenter";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SearchModal } from "./SearchModal";
import { generateBreadcrumbs } from "@/lib/breadcrumbs";
import { Search, ChevronRight, ChevronDown, ChevronUp, Plus, UserPlus, CalendarPlus } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { GlassButton } from "@/components/ui/glass-button";
import { LiveClock } from "./LiveClock";
import { Button } from "@/components/ui/button";

// Navigation links based on role
const getNavLinks = (role: string) => {
  switch (role) {
    case "EMPLOYEE":
      return [
        { href: "/leaves", label: "My Leaves" },
        { href: "/policies", label: "Policies" },
        { href: "/holidays", label: "Holidays" },
      ];
    case "HR_ADMIN":
    case "HR_HEAD":
      return [
        { href: "/approvals", label: "Approvals" },
        { href: "/employees", label: "Employees" },
        { href: "/admin/audit", label: "Audit" },
      ];
    case "DEPT_HEAD":
      return [
        { href: "/approvals", label: "Team Requests" },
        { href: "/policies", label: "Policies" },
      ];
    case "CEO":
      return [
        { href: "/approvals", label: "Approvals" },
        { href: "/employees", label: "Employees" },
        { href: "/reports", label: "Reports" },
      ];
    default:
      return [
        { href: "/leaves", label: "My Leaves" },
        { href: "/policies", label: "Policies" },
        { href: "/holidays", label: "Holidays" },
      ];
  }
};

// Get quick action button based on role
const getQuickAction = (role: string) => {
  switch (role) {
    case "EMPLOYEE":
      return {
        href: "/leaves/apply",
        label: "Apply Leave",
        icon: CalendarPlus,
      };
    case "HR_ADMIN":
    case "HR_HEAD":
      return {
        href: "/admin/users",
        label: "Add User",
        icon: UserPlus,
      };
    default:
      return null;
  }
};

// Get greeting based on time
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function TopNavBar() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [greeting] = useState(getGreeting());

  // Responsive: expanded by default on desktop (≥1024px), collapsed on mobile
  useEffect(() => {
    const checkViewport = () => {
      setIsExpanded(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Live notification indicator
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
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const breadcrumbs = useMemo(() => generateBreadcrumbs(pathname), [pathname]);
  const navLinks = useMemo(
    () => getNavLinks(user?.role || "EMPLOYEE"),
    [user?.role]
  );
  const quickAction = useMemo(
    () => getQuickAction(user?.role || "EMPLOYEE"),
    [user?.role]
  );

  if (!user) return null;

  return (
    <>
      <nav
        className={clsx(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-7xl w-[95%] rounded-2xl px-4 sm:px-6 py-3",
          "backdrop-blur-xl bg-white/70 dark:bg-neutral-900/60 border border-white/20 dark:border-white/10",
          "shadow-lg transition-all duration-300",
          scrolled && "shadow-xl bg-white/80 dark:bg-neutral-900/70",
          "flex items-center justify-between gap-4"
        )}
        role="banner"
      >
        {/* Left Section: Breadcrumbs */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <nav
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 shrink-0"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, index) => (
              <div key={`${crumb.href}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                )}
                <Link
                  href={crumb.href}
                  className={clsx(
                    "transition-colors truncate hover:text-slate-900 dark:hover:text-slate-100",
                    index === breadcrumbs.length - 1
                      ? "font-semibold text-slate-900 dark:text-slate-100"
                      : "hover:underline"
                  )}
                >
                  {crumb.label}
                </Link>
              </div>
            ))}
          </nav>

          {/* Quick Action Button */}
          {quickAction && isExpanded && (
            <Button
              asChild
              size="sm"
              className="hidden md:flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Link href={quickAction.href}>
                <quickAction.icon className="h-3.5 w-3.5" />
                {quickAction.label}
              </Link>
            </Button>
          )}
        </div>

        {/* Center Section: Navigation Links */}
        {isExpanded && (
          <nav
            className="hidden lg:flex items-center gap-1.5 flex-wrap"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href}>
                  <GlassButton
                    variant={isActive ? "active" : "default"}
                    size="sm"
                    className={clsx(
                      "transition-all duration-150 hover:scale-105 active:scale-95",
                      isActive &&
                        "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </GlassButton>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Section: Tools & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Expand/Collapse Button (visible on <1024px) */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden glass-light p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/5 transition-all"
            aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Search */}
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="glass-light hover:bg-white/80 dark:hover:bg-white/5 transition-all hover:scale-105"
            title="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </GlassButton>

          {/* Theme Toggle */}
          <div className="glass-light rounded-lg p-1">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <div className="glass-light rounded-lg">
            <NotificationDropdown />
          </div>

          {/* Greeting & Clock */}
          {isExpanded && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 glass-light rounded-lg text-xs text-slate-700 dark:text-slate-300">
              <span className="font-medium">{greeting},</span>
              <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                {user.name}
              </span>
            </div>
          )}

          {/* Live Clock */}
          <LiveClock />

          {/* User Avatar */}
          <button
            onClick={() => setControlCenterOpen(!controlCenterOpen)}
            aria-label="Open Control Center"
            aria-expanded={controlCenterOpen}
            aria-haspopup="true"
            className={clsx(
              "glass-light relative h-9 w-9 rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95",
              controlCenterOpen
                ? "border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/50"
                : "border-white/20 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-700"
            )}
          >
            <div className="h-full w-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            {hasAlerts && (
              <span
                className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 animate-pulse"
                aria-label="You have new notifications"
              />
            )}
          </button>
        </div>
      </nav>

      {/* Control Center Popover */}
      {controlCenterOpen && (
        <div className="fixed top-20 right-4 z-50">
          <ControlCenter onClose={() => setControlCenterOpen(false)} />
        </div>
      )}

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
