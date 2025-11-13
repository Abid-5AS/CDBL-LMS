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
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-xl bg-zinc-100/50 dark:bg-zinc-900/40 p-2.5 shadow-[0_0_20px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 focus-ring transition-all duration-300"
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
              <X size={20} className="text-zinc-900 dark:text-zinc-100" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={20} className="text-zinc-900 dark:text-zinc-100" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
