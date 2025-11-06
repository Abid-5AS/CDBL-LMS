"use client";

import { useUser } from "@/lib/user-context";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import ControlCenter from "./ControlCenter";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SearchModal } from "./SearchModal";
import { generateBreadcrumbs } from "@/lib/breadcrumbs";
import {
  Search,
  ChevronRight,
  Plus,
  UserPlus,
  CalendarPlus,
  FileText,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { GlassButton } from "@/components/ui/glass-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

// Get greeting based on time
function getGreeting(firstName?: string): string {
  const hour = new Date().getHours();
  let greeting = "";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";
  else greeting = "Good Evening";

  return firstName ? `${greeting}, ${firstName}` : greeting;
}

// Lightweight clock hook
function useClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    update();
    const id = setInterval(update, 60000); // Update every minute
    return () => clearInterval(id);
  }, []);

  return { time, date };
}

export default function TopNavBar() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { time, date } = useClock();
  const firstName = user?.name?.split(" ")[0] || "";
  const greeting = useMemo(() => getGreeting(firstName), [firstName]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Ctrl+, or Cmd+,: Control Center
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setControlCenterOpen(!controlCenterOpen);
      }

      // Ctrl+L or Cmd+L: Apply Leave (for employees)
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        if (user?.role === "EMPLOYEE") {
          e.preventDefault();
          router.push("/leaves/apply");
        }
      }

      // g + key: Quick navigation (only when not in input/textarea)
      if (
        e.key === "g" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        const handleNextKey = (nextEvent: KeyboardEvent) => {
          nextEvent.preventDefault();
          if (nextEvent.key === "d") {
            router.push("/dashboard");
          } else if (nextEvent.key === "r") {
            router.push("/leaves");
          } else if (nextEvent.key === "a") {
            router.push("/approvals");
          }
          window.removeEventListener("keydown", handleNextKey);
        };
        window.addEventListener("keydown", handleNextKey, { once: true });
        setTimeout(() => {
          window.removeEventListener("keydown", handleNextKey);
        }, 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controlCenterOpen, router, user?.role]);

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

  const breadcrumbs = useMemo(() => {
    // For manager/dashboard and dept-head dashboard, don't show breadcrumbs in navbar (page has its own)
    if (pathname.startsWith("/manager/dashboard") || pathname.startsWith("/dashboard/dept-head")) {
      return [];
    }
    return generateBreadcrumbs(pathname);
  }, [pathname]);

  // Get "+ New" menu items based on role
  type MenuItem = {
    label: string;
    href: string;
    icon: typeof CalendarPlus;
    shortcut?: string;
  };

  const getNewMenuItems = (): MenuItem[] => {
    if (!user) return [];
    switch (user.role) {
      case "EMPLOYEE":
        return [
          {
            label: "Apply Leave",
            href: "/leaves/apply",
            icon: CalendarPlus,
            shortcut: "⌘L",
          },
        ];
      case "HR_ADMIN":
      case "HR_HEAD":
        return [
          {
            label: "Add Employee",
            href: "/admin/users/create",
            icon: UserPlus,
          },
          {
            label: "Create Adjustment",
            href: "/admin/adjustments/create",
            icon: FileText,
          },
        ];
      case "DEPT_HEAD":
        // Department Heads manage requests, they don't apply for leave in this context
        return [];
      default:
        return [];
    }
  };

  const newMenuItems = getNewMenuItems();

  // Check if mobile (for responsive utilities menu)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!user) return null;

  return (
    <>
      <nav
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 border-b border-border bg-background",
          (pathname.startsWith("/manager/dashboard") || pathname.startsWith("/dashboard/dept-head")) ? "h-12" : "h-14",
          "shadow-sm transition-shadow duration-300",
          scrolled && "shadow-md"
        )}
        role="navigation"
        aria-label="Global navigation"
      >
        <div className={clsx(
          "h-full flex items-center justify-between",
          (pathname.startsWith("/manager/dashboard") || pathname.startsWith("/dashboard/dept-head")) ? "w-full px-3 sm:px-4 lg:px-6" : "w-full px-4"
        )}>
          {/* Left Section: App Name - Only for manager/dept-head dashboard */}
          {(pathname.startsWith("/manager/dashboard") || pathname.startsWith("/dashboard/dept-head")) ? (
            <h1 className="text-sm font-semibold tracking-tight text-muted-foreground">
              CDBL Leave Management
            </h1>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <nav
                className="flex items-center gap-1.5 text-sm text-foreground shrink-0 min-w-0"
                aria-label="Breadcrumb"
              >
                {breadcrumbs.map((crumb, index) => (
                  <div
                    key={`${crumb.href}-${index}`}
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    {index > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <Link
                      href={crumb.href}
                      className={clsx(
                        "transition-colors truncate hover:text-primary",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded",
                        index === breadcrumbs.length - 1
                          ? "font-semibold text-foreground"
                          : "hover:underline"
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
                {/* Filter chip for list pages */}
                {(pathname.startsWith("/leaves") ||
                  pathname.startsWith("/approvals")) && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <button
                      onClick={() => {
                        router.push(pathname.split("?")[0]);
                      }}
                      className="px-2 py-0.5 text-xs font-medium rounded-md bg-accent text-accent-foreground hover:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 shrink-0"
                      aria-label="Remove filter"
                    >
                      {pathname.includes("status=pending")
                        ? "Pending"
                        : pathname.includes("status=approved")
                        ? "Approved"
                        : "All"}
                      <span className="ml-1 text-indigo-500">×</span>
                    </button>
                  </>
                )}
              </nav>

              {/* + New Menu */}
              {newMenuItems.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0"
                      aria-label="New"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">New</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>New</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {newMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className="flex items-center gap-2"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {item.shortcut && (
                              <DropdownMenuShortcut>
                                {item.shortcut}
                              </DropdownMenuShortcut>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Center Section: Greeting, Time, Date - Hidden for manager dashboard */}
          {!(pathname.startsWith("/manager/dashboard") || pathname.startsWith("/dashboard/dept-head")) && (
            <div
              className={clsx(
                "hidden md:flex flex-col items-center text-xs text-muted-foreground select-none",
                "transition-opacity hover:opacity-80 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1"
              )}
              onClick={() => setControlCenterOpen(!controlCenterOpen)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setControlCenterOpen(!controlCenterOpen);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Control Center (Ctrl+,)"
              title="Control Center (Ctrl+,)"
            >
              <span className="font-medium">{greeting}</span>
              <span className="text-[10px] opacity-75">
                {time} | {date}
              </span>
            </div>
          )}

          {/* Right Section: Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <GlassButton
                    variant="ghost"
                    size="icon"
                    className="glass-light hover:bg-accent transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </GlassButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={() => setSearchOpen(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                    <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-sm">Theme</span>
                    <ThemeToggle />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Search */}
                <GlassButton
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  aria-keyshortcuts="Meta+K Ctrl+K"
                  className="glass-light hover:bg-accent transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  title="Search (⌘K / Ctrl+K)"
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
              </>
            )}

            {/* Profile Avatar */}
            <button
              onClick={() => setControlCenterOpen(!controlCenterOpen)}
              aria-label="Profile & Settings"
              aria-keyshortcuts="Meta+, Ctrl+,"
              aria-expanded={controlCenterOpen}
              aria-haspopup="true"
              className={clsx(
                "glass-light relative h-9 w-9 rounded-full overflow-hidden border-2 transition-all",
                "hover:scale-110 active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
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
        </div>
      </nav>

      {/* Control Center Popover */}
      {controlCenterOpen && (
        <div className="fixed top-16 right-4 z-50">
          <ControlCenter onClose={() => setControlCenterOpen(false)} />
        </div>
      )}

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
