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
  "user" | "router" | "navLinks" | "isActive" | "scrolled" | "logout" | "loggingOut"
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
  const navHeight = scrolled ? 72 : 88;

  if (!user) return null;

  return (
    <div
      className="hidden md:flex w-full min-w-0 flex-nowrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      style={{ height: navHeight }}
    >
      <div className="flex flex-1 min-w-0 flex-nowrap items-center gap-4 overflow-hidden">
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
          className="relative hidden md:flex flex-1 min-w-0 max-w-full items-center justify-center overflow-hidden rounded-full border border-border bg-background/80 p-1.5 shadow-sm backdrop-blur-xl dark:border-border dark:bg-background/30"
        >
          <nav role="navigation" aria-label="Primary navigation" className="w-full min-w-0">
            <ul className="flex w-full flex-nowrap items-center gap-0.5">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.3 + index * 0.05,
                    }}
                  >
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group/link relative flex flex-nowrap items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 focus-ring",
                        active
                          ? "border border-primary/40 shadow-md bg-primary/10 text-primary-foreground dark:border-primary/30 dark:text-primary-foreground"
                          : "border border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground dark:text-muted-foreground dark:hover:bg-background/50 dark:hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-all duration-300",
                          active
                            ? "scale-105 text-foreground dark:text-foreground"
                            : "text-muted-foreground group-hover/link:scale-110 group-hover/link:text-foreground dark:text-muted-foreground"
                        )}
                      />
                      <span className="relative hidden lg:inline whitespace-nowrap font-medium">
                        {link.label}
                        {active && (
                          <motion.div
                            layoutId="activeUnderline"
                            className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        )}
                      </span>
                    </Link>
                  </motion.li>
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
        className="flex shrink-0 flex-nowrap items-center gap-2"
      >
        <div className="hidden lg:flex">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-foreground dark:text-foreground"
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
            className="text-foreground dark:text-foreground"
            onClick={openSearch}
            aria-label="Open search dialog"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Apply Leave button - Only for EMPLOYEE and DEPT_HEAD roles */}
        {(user.role === "EMPLOYEE" || user.role === "DEPT_HEAD") && (
          <Button
            size="sm"
            className="gap-1.5 backdrop-blur-md bg-background/80 dark:bg-background/40 border border-border hover:bg-background/90 dark:hover:bg-background/50 shadow-sm"
            leftIcon={<CalendarPlus className="h-4 w-4" />}
            onClick={() => router.push("/leaves/apply")}
            aria-label="Apply for leave"
          >
            Apply
          </Button>
        )}

        <div className="flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-1 shadow-sm backdrop-blur-xl dark:bg-background/40">
          <NotificationDropdown />
          <ThemeToggle />
          <AnnotationsToggle />
          <div className="h-5 w-px bg-border" />
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
