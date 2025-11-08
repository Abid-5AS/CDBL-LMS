"use client";

import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { NavbarState } from "./use-navbar-state";
import { Brand } from "./Brand";

type MobileBarProps = Pick<
  NavbarState,
  "toggleMobileMenu" | "isMobileMenuOpen"
>;

export function MobileBar({
  toggleMobileMenu,
  isMobileMenuOpen,
}: MobileBarProps) {
  return (
    <div className="flex items-center justify-between md:hidden">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Brand compact />
      </motion.div>

      {/* Menu Toggle Button */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glass-pill p-2.5 shadow-md backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl focus-ring hover-lift active-press"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
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
              <X size={20} className="text-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={20} className="text-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
