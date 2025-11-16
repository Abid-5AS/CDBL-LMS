"use client";

import { motion, AnimatePresence } from "framer-motion";

import { DesktopNav } from "./DesktopNav";
import { MobileBar } from "./MobileBar";
import { MobileMenu } from "./MobileMenu";
import { useNavbarState } from "./use-navbar-state";
import { useHasMounted } from "@/hooks/use-has-mounted";

export function Navbar() {
  const state = useNavbarState();
  const mounted = useHasMounted();

  if (!state.user || !mounted) return null;

  return (
    <div>
      <motion.nav
        key="navbar"
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          height: state.scrolled ? 72 : 88,
        }}
        transition={{
          duration: 0.4,
          height: { duration: 0.3, ease: "easeInOut" },
        }}
        className="fixed top-0 z-50 w-full border-b backdrop-blur-2xl"
        role="navigation"
        aria-label="Main navigation"
        style={{
          backgroundColor: "var(--shell-sidebar-bg)",
          borderColor: "var(--shell-divider)",
          boxShadow: state.scrolled ? "var(--shadow-2)" : "var(--shadow-1)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/25 dark:from-white/5 dark:via-white/0 dark:to-white/5" />
        </div>

        {/* Content container */}
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <DesktopNav {...state} />
          <MobileBar {...state} />
        </div>

        {/* Bottom border with gradient */}
        <motion.div
          key="border"
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--shell-divider)] to-transparent"
          animate={{
            opacity: state.scrolled ? 1 : 0.4,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </motion.nav>

      <AnimatePresence>
        {state.isMobileMenuOpen && <MobileMenu {...state} />}
      </AnimatePresence>
    </div>
  );
}
