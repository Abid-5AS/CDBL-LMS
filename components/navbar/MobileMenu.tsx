"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
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
>;

const menuVariants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
      when: "afterChildren",
    },
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
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
      ease: [0.22, 1, 0.36, 1],
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
          ref={gestureRef}
          variants={menuVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="md:hidden overflow-hidden"
        >
          {/* Glass morphism background */}
          <div className="glass-modal-overlay absolute inset-0" />
          <div className="relative glass-nav border-t border-white/20 dark:border-white/10">
            <div className="container-responsive py-6 space-y-6">
              {/* Search Bar */}
              <motion.div variants={itemVariants}>
                <button
                  className="w-full flex items-center gap-3 glass-base p-4 rounded-2xl shadow-md border border-white/20 dark:border-white/10 text-left focus-ring hover-lift"
                  onClick={() => {
                    openSearch();
                    closeMobileMenu();
                  }}
                >
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Search...</span>
                  <kbd className="ml-auto inline-flex items-center gap-1 rounded border bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                    ⌘K
                  </kbd>
                </button>
              </motion.div>

              {/* Navigation Links */}
              <motion.nav variants={itemVariants} className="space-y-2">
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
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl text-base font-medium transition-all duration-200 focus-ring hover-lift active-press",
                          active
                            ? "bg-primary/90 text-primary-foreground shadow-md"
                            : "glass-base border border-white/20 dark:border-white/10 text-foreground hover:border-primary/40"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                            active
                              ? "bg-white/20 text-primary-foreground"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="flex-1">{link.label}</span>
                        {link.badge && (
                          <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
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
                className="h-px bg-linear-to-r from-transparent via-border to-transparent"
              />

              {/* User Profile Section */}
              <motion.div variants={itemVariants}>
                <div className="glass-base p-4 rounded-2xl border border-white/20 dark:border-white/10 shadow-md">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-lg shadow-lg">
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.role?.toLowerCase()}
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
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
                      className="justify-start"
                      onClick={() => router.push("/api/auth/logout")}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
