"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Settings, LogOut } from "lucide-react";

import { useUser } from "@/lib/user-context";
import { getNavItemsForRole, type UserRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const state = useNavbarState();
  if (!state.user) return null;

  return (
    <motion.nav
      animate={{ height: state.scrolled ? 60 : 72 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 z-50 w-full"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-4">
        <DesktopNav {...state} />
        <MobileBar {...state} />
      </div>
      <MobileMenu {...state} />
    </motion.nav>
  );
}

type NavbarState = {
  user: ReturnType<typeof useUser>;
  router: ReturnType<typeof useRouter>;
  navLinks: ReturnType<typeof getNavItemsForRole>;
  scrolled: boolean;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  isActive: (href: string) => boolean;
};

function useNavbarState(): NavbarState {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  const navLinks = useMemo(() => {
    if (!user?.role) return [];
    return getNavItemsForRole(user.role as UserRole);
  }, [user?.role]);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") {
        return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
      }
      if (href.startsWith("/dashboard/")) {
        return pathname === href || pathname.startsWith(`${href}/`);
      }
      if (href === "/leaves/apply") {
        return pathname === "/leaves/apply";
      }
      if (href === "/leaves") {
        return (
          pathname === "/leaves" ||
          (pathname.startsWith("/leaves/") && pathname !== "/leaves/apply")
        );
      }
      if (href === "/reports") {
        return pathname === "/reports";
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const toggleMobileMenu = useCallback(
    () => setIsMobileMenuOpen((open) => !open),
    [],
  );

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return {
    user,
    router,
    navLinks,
    scrolled,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isActive,
  };
}

function DesktopNav({
  user,
  router,
  navLinks,
  isActive,
}: NavbarState) {
  if (!user) return null;
  return (
    <div className="hidden items-center justify-between md:flex">
      <Brand />
      <div className="glass-pill rounded-full px-4 py-2 shadow-md backdrop-blur-sm">
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
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                    active
                      ? "bg-white/60 text-indigo-600 dark:bg-white/10 dark:text-indigo-400"
                      : "text-neutral-700 hover:bg-white/50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-neutral-50",
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
      <div className="glass-pill flex items-center gap-2 rounded-full p-2 shadow-md backdrop-blur-sm">
        <NotificationDropdown />
        <ThemeToggle />
        <ProfileMenu user={user} onLogout={() => router.push("/api/auth/logout")} />
      </div>
    </div>
  );
}

function MobileBar({
  toggleMobileMenu,
  isMobileMenuOpen,
}: NavbarState) {
  return (
    <div className="flex items-center justify-between md:hidden">
      <Brand compact />
      <button
        className="rounded-md p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? (
          <X size={20} className="text-neutral-900 dark:text-neutral-50" />
        ) : (
          <Menu size={20} className="text-neutral-900 dark:text-neutral-50" />
        )}
      </button>
    </div>
  );
}

function MobileMenu({
  user,
  router,
  navLinks,
  isActive,
  isMobileMenuOpen,
  closeMobileMenu,
}: NavbarState) {
  if (!user) return null;
  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden border-t border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80"
        >
          <div className="flex flex-col gap-3 px-6 py-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                    active
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                      : "text-neutral-700 hover:bg-neutral-100/80 hover:text-indigo-600 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:text-indigo-400",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <hr className="border-neutral-200 dark:border-neutral-700" />
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-xs">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  closeMobileMenu();
                  router.push("/settings");
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-red-200 text-red-600 dark:border-red-800 dark:text-red-400"
                onClick={() => router.push("/api/auth/logout")}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProfileMenu({
  user,
  onLogout,
}: {
  user: NonNullable<ReturnType<typeof useUser>>;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-9 w-9 rounded-full transition-colors hover:bg-white/50 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          aria-label="User profile"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-xs">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
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
          onClick={onLogout}
          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Go to dashboard"
      className={cn("flex items-center gap-2 group", compact ? "" : "glass-pill rounded-full p-2 shadow-md backdrop-blur-sm")}
    >
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold shadow-md",
          compact ? "h-8 w-8 rounded-lg text-sm" : "h-9 w-9 rounded-xl text-sm",
        )}
      >
        CDBL
      </div>
      {!compact && (
        <span className="text-xl font-bold text-neutral-900 transition-colors group-hover:text-indigo-600 dark:text-neutral-50 dark:group-hover:text-indigo-400">
          CDBL LMS
        </span>
      )}
      {compact && (
        <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          CDBL Leave
        </span>
      )}
    </Link>
  );
}
