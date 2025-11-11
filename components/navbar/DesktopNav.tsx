"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Command } from "lucide-react";

import { NotificationDropdown } from "@/components/navbar";
import { ThemeToggle } from "../theme-toggle";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/use-search";

import type { NavbarState } from "./use-navbar-state";
import { Brand } from "./Brand";
import { ProfileMenu } from "./ProfileMenu";

type DesktopNavProps = Pick<
  NavbarState,
  "user" | "router" | "navLinks" | "isActive" | "scrolled"
>;

export function DesktopNav({
  user,
  router,
  navLinks,
  isActive,
  scrolled,
}: DesktopNavProps) {
  const { openSearch } = useSearch();

  if (!user) return null;

  return (
    <div className="hidden items-center justify-between md:flex">
      {/* Brand Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Brand />
      </motion.div>

      {/* Navigation Links */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass-pill rounded-full px-2 py-2 shadow-lg backdrop-blur-md border border-white/20 dark:border-white/10"
      >
        <nav role="navigation" aria-label="Primary navigation">
          <ul className="flex items-center gap-1">
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
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-ring hover-lift whitespace-nowrap",
                      active
                        ? "bg-primary/90 text-primary-foreground shadow-md"
                        : "text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium whitespace-nowrap">{link.label}</span>

                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-full bg-primary/20 -z-10"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Hover underline */}
                    <motion.div
                      className="absolute bottom-1 left-1/2 h-0.5 bg-current rounded-full underline-hover"
                      initial={{ width: 0, x: "-50%" }}
                      whileHover={{ width: "60%" }}
                      transition={{ duration: 0.2 }}
                    />
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>
      </motion.div>

      {/* Actions Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-pill flex items-center gap-1 rounded-full p-1.5 shadow-lg backdrop-blur-md border border-white/20 dark:border-white/10"
      >
        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-200 focus-ring"
          onClick={openSearch}
        >
          <Search className="h-4 w-4" />
          <span className="hidden lg:inline">Search</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </motion.button>

        {/* Divider */}
        <div className="h-6 w-px bg-border/50" />

        {/* Notifications */}
        <NotificationDropdown />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Menu */}
        <ProfileMenu
          user={user}
          onLogout={() => router.push("/api/auth/logout")}
        />
      </motion.div>
    </div>
  );
}
