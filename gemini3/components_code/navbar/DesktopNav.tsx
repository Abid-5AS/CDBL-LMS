"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Command, CalendarPlus } from "lucide-react";

import { NotificationDropdown } from "@/components/navbar";
import { ThemeToggle } from "../theme-toggle";
import { AnnotationsToggle } from "../annotations-toggle";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/button";

import type { NavbarState } from "./use-navbar-state";
import { Brand } from "./Brand";
import { ProfileMenu } from "./ProfileMenu";

type DesktopNavProps = Pick<
  NavbarState,
  | "user"
  | "router"
  | "navLinks"
  | "isActive"
  | "scrolled"
  | "logout"
  | "loggingOut"
>;

export function DesktopNav({
  user,
  router,
  navLinks,
  isActive,
  scrolled,
  logout,
  loggingOut,
}: DesktopNavProps) {
  const { openSearch } = useSearch();
  const navHeight = scrolled ? 64 : 72;

  if (!user) return null;

  return (
    <div
      className="hidden md:flex w-full min-w-0 flex-nowrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 overflow-x-hidden"
      style={{ height: navHeight }}
    >
      <div className="flex flex-1 min-w-0 flex-nowrap items-center gap-6 overflow-hidden">
        {/* Brand Section - stays pinned to the left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-shrink-0"
        >
          <Brand compact />
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative hidden md:flex flex-1 min-w-0 max-w-full items-center overflow-x-auto scrollbar-hide"
        >
          <nav
            role="navigation"
            aria-label="Primary navigation"
            className="w-full min-w-0"
          >
            <ul className="flex w-full flex-nowrap items-center gap-1">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "group/link relative flex flex-nowrap items-center gap-2 overflow-hidden whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 focus-ring",
                        active
                          ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-all duration-200",
                          active
                            ? "text-primary dark:text-primary-foreground"
                            : "text-muted-foreground group-hover/link:text-foreground"
                        )}
                      />
                      <span className="relative hidden lg:inline whitespace-nowrap font-medium">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </motion.div>
      </div>

      {/* Actions Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex shrink-0 flex-nowrap items-center gap-3"
      >
        <div className="hidden lg:flex">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground bg-background/50 border-border/50"
            onClick={openSearch}
            leftIcon={<Search className="h-4 w-4" />}
            aria-label="Search leaves and related information"
          >
            Search
            <kbd className="ml-1 hidden xl:inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
        </div>
        <div className="flex lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={openSearch}
            aria-label="Open search dialog"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Apply Leave button - All roles except CEO */}
        {user.role !== "CEO" && (
          <Button
            size="sm"
            className="gap-1.5 shadow-sm"
            leftIcon={<CalendarPlus className="h-4 w-4" />}
            onClick={() => router.push("/leaves/apply")}
            aria-label="Apply for leave"
          >
            Apply
          </Button>
        )}

        <div className="flex items-center gap-1 pl-2 border-l border-border">
          <NotificationDropdown />
          <ThemeToggle />
          <ProfileMenu
            user={user}
            onLogout={logout}
            isLoggingOut={loggingOut}
          />
        </div>
      </motion.div>
    </div>
  );
}
