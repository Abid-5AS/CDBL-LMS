"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, Search } from "lucide-react";

import { ThemeToggle } from "../theme-toggle";
import { AnnotationsToggle } from "../annotations-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGesture } from "@/hooks/use-gesture";
import { useSearch } from "@/hooks/use-search";

import type { NavbarState } from "./use-navbar-state";

type MobileMenuProps = Pick<
  NavbarState,
  | "user"
  | "router"
  | "navLinks"
  | "isActive"
  | "isMobileMenuOpen"
  | "closeMobileMenu"
  | "logout"
  | "loggingOut"
>;

const menuVariants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      when: "afterChildren",
    },
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.4,
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  closed: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function MobileMenu({
  user,
  router,
  navLinks,
  isActive,
  isMobileMenuOpen,
  closeMobileMenu,
  logout,
  loggingOut,
}: MobileMenuProps) {
  const { openSearch } = useSearch();

  // Add gesture support for closing menu
  const gestureRef = useGesture({
    onSwipeUp: closeMobileMenu,
    onSwipeLeft: closeMobileMenu,
    threshold: 50,
  });

  if (!user) return null;

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          id="mobile-menu"
          ref={gestureRef}
          variants={menuVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="md:hidden overflow-hidden fixed inset-x-0 top-[64px] bg-background/95 backdrop-blur-xl border-b border-border shadow-lg z-40"
          role="navigation"
          aria-label="Mobile navigation menu"
        >
          <div className="container-responsive py-6 space-y-6 max-h-[calc(100vh-64px)] overflow-y-auto">
            {/* Search Bar */}
            <motion.div variants={itemVariants}>
              <button
                type="button"
                className="w-full flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border text-left focus-ring hover:bg-muted transition-colors"
                onClick={() => {
                  openSearch();
                  closeMobileMenu();
                }}
                aria-label="Search leaves and related information"
              >
                <Search className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Search...</span>
                <kbd className="ml-auto inline-flex items-center gap-1 rounded border bg-background px-2 py-1 text-xs font-mono text-muted-foreground">
                  ⌘K
                </kbd>
              </button>
            </motion.div>

            {/* Navigation Links */}
            <motion.nav variants={itemVariants} className="space-y-1" aria-label="Navigation links">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <motion.div
                    key={link.href}
                    variants={itemVariants}
                    custom={index}
                  >
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 focus-ring",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex-1">{link.label}</span>
                      {link.badge && (
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="h-px bg-border"
            />

            {/* User Profile Section */}
            <motion.div variants={itemVariants}>
              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-9"
                    onClick={() => {
                      closeMobileMenu();
                      router.push("/settings");
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="justify-start h-9"
                    disabled={loggingOut}
                    aria-busy={loggingOut}
                    onClick={() => {
                      closeMobileMenu();
                      logout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {loggingOut ? "..." : "Logout"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
