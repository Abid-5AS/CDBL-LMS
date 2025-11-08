"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { NavbarState } from "./use-navbar-state";

type MobileMenuProps = Pick<
  NavbarState,
  "user" | "router" | "navLinks" | "isActive" | "isMobileMenuOpen" | "closeMobileMenu"
>;

export function MobileMenu({
  user,
  router,
  navLinks,
  isActive,
  isMobileMenuOpen,
  closeMobileMenu,
}: MobileMenuProps) {
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
