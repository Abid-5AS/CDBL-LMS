"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Command, CalendarPlus } from "lucide-react";

import { NotificationDropdown } from "@/components/navbar";
import { ThemeToggle } from "../theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { AnnotationsToggle } from "../annotations-toggle";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks";
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
                        "group/link relative flex flex-nowrap items-center gap-2 overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 border border-transparent",
                        active
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg dark:from-indigo-500 dark:to-violet-500"
                          : "text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-all duration-300",
                          active
                            ? "text-white"
                            : "text-muted-foreground group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400"
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
            className="gap-2 text-muted-foreground hover:text-indigo-600 bg-muted/50 border-transparent hover:bg-white hover:shadow-sm dark:hover:bg-muted dark:bg-muted/30 rounded-full pl-3 pr-2 h-9 transition-all duration-200"
            onClick={openSearch}
            leftIcon={<Search className="h-4 w-4" />}
            aria-label="Search leaves and related information"
          >
            <span className="font-normal text-xs mr-2">Search...</span>
            <kbd className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
              <Command className="h-2.5 w-2.5" />K
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
            className="gap-1.5 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
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
          <LanguageSwitcher />
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
