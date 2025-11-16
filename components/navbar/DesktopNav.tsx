"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Command } from "lucide-react";

import { NotificationDropdown } from "@/components/navbar";
import { ThemeToggle } from "../theme-toggle";
import { AnnotationsToggle } from "../annotations-toggle";
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
    <div className="hidden items-center justify-between gap-8 md:flex">
      {/* Brand Section - More Compact */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-shrink-0"
      >
        <Brand compact />
      </motion.div>

      {/* Navigation Links - Premium Segmented Control */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="group relative flex items-center gap-0.5 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/40 p-1 shadow-[0_0_20px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-xl border border-zinc-200/50 dark:border-white/5"
      >
        <nav role="navigation" aria-label="Primary navigation">
          <ul className="flex items-center gap-0.5">
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
                      "group/link relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all duration-300 focus-ring whitespace-nowrap overflow-hidden",
                      active
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-md shadow-zinc-900/5 dark:shadow-zinc-950/20 border border-zinc-200/60 dark:border-zinc-700/60"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50 border border-transparent"
                    )}
                  >
                    {/* Gradient overlay on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 opacity-0 group-hover/link:opacity-100 -z-10"
                      initial={false}
                      transition={{ duration: 0.3 }}
                    />

                    <Icon
                      className={cn(
                        "h-4 w-4 transition-all duration-300 shrink-0",
                        active
                          ? "text-zinc-900 dark:text-zinc-100 scale-105"
                          : "text-zinc-500 dark:text-zinc-500 group-hover/link:scale-110 group-hover/link:text-zinc-900 dark:group-hover/link:text-zinc-100"
                      )}
                    />
                    <span className="hidden lg:inline font-medium whitespace-nowrap relative">
                      {link.label}
                      {/* Active underline indicator */}
                      {active && (
                        <motion.div
                          layoutId="activeUnderline"
                          className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                    </span>

                    {/* Active glow effect */}
                    {active && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 -z-20"
                        initial={false}
                        animate={{
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>
      </motion.div>

      {/* Actions Section - Clean Rounded Block */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center gap-1.5 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/40 px-1.5 py-1 shadow-[0_0_20px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 shrink-0"
      >
        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="group/search relative flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/60 transition-all duration-300 focus-ring overflow-hidden"
          onClick={openSearch}
        >
          {/* Hover gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover/search:opacity-100 -z-10"
            initial={false}
            transition={{ duration: 0.3 }}
          />

          <Search className="h-4 w-4 transition-transform duration-300 group-hover/search:rotate-12" />
          <span className="hidden xl:inline font-medium">Search</span>
          <kbd className="hidden xl:inline-flex items-center gap-1 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/80 px-1.5 py-0.5 text-xs font-mono text-zinc-600 dark:text-zinc-400 shadow-sm">
            <Command className="h-3 w-3" />K
          </kbd>
        </motion.button>

        {/* Subtle Divider */}
        <div className="h-5 w-px bg-zinc-300/50 dark:bg-zinc-700/50" />

        {/* Notifications */}
        <div className="flex items-center">
          <NotificationDropdown />
        </div>

        {/* Theme Toggle & Annotations (Development) */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AnnotationsToggle />
        </div>

        {/* Divider before profile */}
        <div className="h-5 w-px bg-zinc-300/50 dark:bg-zinc-700/50" />

        {/* Profile Menu */}
        <ProfileMenu
          user={user}
          onLogout={() => router.push("/api/auth/logout")}
        />
      </motion.div>
    </div>
  );
}
