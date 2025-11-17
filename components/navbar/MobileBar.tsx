"use client";

import { CalendarPlus, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { NavbarState } from "./use-navbar-state";
import { Brand } from "./Brand";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/navbar";
import { ProfileMenu } from "./ProfileMenu";

type MobileBarProps = Pick<
  NavbarState,
  | "toggleMobileMenu"
  | "isMobileMenuOpen"
  | "router"
  | "user"
  | "scrolled"
  | "logout"
  | "loggingOut"
>;

export function MobileBar({
  toggleMobileMenu,
  isMobileMenuOpen,
  router,
  user,
  scrolled,
  logout,
  loggingOut,
}: MobileBarProps) {
  if (!user) return null;
  const navHeight = scrolled ? 72 : 88;

  return (
    <div
      className="flex w-full min-w-0 items-center gap-3 px-4 sm:px-6 lg:px-8 md:hidden"
      style={{ height: navHeight }}
    >
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Brand compact />
      </motion.div>

      <div className="ml-auto flex items-center gap-2">
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex-shrink-0"
        >
          <NotificationDropdown />
        </motion.div>

        {/* Apply Leave button - Only for EMPLOYEE and DEPT_HEAD roles */}
        {(user.role === "EMPLOYEE" || user.role === "DEPT_HEAD") && (
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex-shrink-0"
          >
            <Button
              size="sm"
              className="gap-1.5 backdrop-blur-md bg-background/80 dark:bg-background/40 border border-border hover:bg-background/90 dark:hover:bg-background/50 shadow-sm"
              leftIcon={<CalendarPlus className="h-4 w-4" />}
              onClick={() => router.push("/leaves/apply")}
              aria-label="Apply for leave"
            >
              Apply
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="flex-shrink-0"
        >
          <ProfileMenu
            user={user}
            onLogout={logout}
            isLoggingOut={loggingOut}
          />
        </motion.div>

        {/* Menu Toggle Button */}
        <motion.button
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 rounded-xl border border-border bg-muted/50 p-2.5 shadow-sm backdrop-blur-xl focus-ring transition-all duration-300 dark:border-border dark:bg-muted/40"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={20} className="text-foreground dark:text-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu
                  size={20}
                  className="text-foreground dark:text-foreground"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
