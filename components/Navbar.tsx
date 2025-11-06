"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/user-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { Menu, X, User, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getNavItemsForRole, type UserRole } from "@/lib/navigation";

export function Navbar() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    if (typeof window === "undefined") return;

    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileMenuOpen]);

  // Get role-based navigation links
  const navLinks = useMemo(() => {
    if (!user?.role) return [];
    return getNavItemsForRole(user.role as UserRole);
  }, [user?.role]);

  if (!user) return null;

  const isActive = (href: string) => {
    // Dashboard routes - match both /dashboard and /dashboard/{role}
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    }
    // Role-specific dashboard routes - exact or starts with
    if (href.startsWith("/dashboard/")) {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    // Exact match for apply leave page
    if (href === "/leaves/apply") {
      return pathname === "/leaves/apply";
    }
    // For /leaves route, match /leaves but exclude /leaves/apply
    if (href === "/leaves") {
      return (
        pathname === "/leaves" ||
        (pathname.startsWith("/leaves/") && pathname !== "/leaves/apply")
      );
    }
    // For other routes, check exact match first, then startsWith for nested routes
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <motion.nav
      animate={{ height: scrolled ? 60 : 72 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className=" fixed top-0 z-50 w-full"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* DESKTOP: 3-part layout */}
        <nav className="hidden md:flex justify-between items-center">
          {/* LEFT: Brand (no container) */}
          <div className="flex items-center gap-2 glass-pill shadow-md rounded-full p-2 backdrop-blur-sm">
            <Link
              href="/dashboard"
              aria-label="Go to dashboard"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-md">
                CDBL
              </div>
              <span className="text-xl font-bold text-neutral-900 dark:text-neutral-50 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                CDBL LMS
              </span>
            </Link>
          </div>

          {/* CENTER: Navigation Links (Glass Pill) */}
          <div className="glass-pill shadow-md rounded-full px-4 py-2 backdrop-blur-sm">
            <ul className="flex items-center gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 flex items-center gap-1.5",
                        active
                          ? "text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-white/10"
                          : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-50 hover:bg-white/50 dark:hover:bg-white/10"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* RIGHT: User Actions (Glass Pill) */}
          <div className="flex items-center gap-2 glass-pill shadow-md rounded-full p-2 backdrop-blur-sm">
            {/* Notifications */}
            <NotificationDropdown />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 rounded-full overflow-hidden p-0 hover:bg-white/50 dark:hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
                  aria-label="User profile"
                >
                  <div className="h-full w-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    router.push("/api/auth/logout");
                  }}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* MOBILE: brand left + menu toggle right */}
        <div className="flex items-center justify-between md:hidden">
          <Link
            href="/dashboard"
            aria-label="Go to dashboard"
            className="flex items-center gap-2 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-sm">
              CDBL
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              CDBL Leave
            </span>
          </Link>
          <button
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X size={20} className="text-neutral-900 dark:text-neutral-50" />
            ) : (
              <Menu
                size={20}
                className="text-neutral-900 dark:text-neutral-50"
              />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md overflow-hidden"
          >
            <div className="flex flex-col px-6 py-4 space-y-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                      active
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                        : "text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <hr className="border-neutral-200 dark:border-neutral-700 my-2" />
              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/settings");
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => {
                    router.push("/api/auth/logout");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
