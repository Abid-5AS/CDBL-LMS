"use client";

import { motion, AnimatePresence } from "framer-motion";

import { DesktopNav } from "./DesktopNav";
import { MobileBar } from "./MobileBar";
import { MobileMenu } from "./MobileMenu";
import { useNavbarState } from "./use-navbar-state";
import { cn } from "@/lib/utils";
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
        className={cn(
          "fixed top-0 z-50 w-full border-b border-border",
          "bg-background/90 backdrop-blur-2xl shadow-[0_15px_45px_rgba(15,23,42,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)]",
          "relative overflow-x-hidden"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 dark:from-white/5 dark:via-white/0 dark:to-white/5" />
        </div>

        {/* Content container */}
        <div className="relative mx-auto flex h-full w-full max-w-7xl min-w-0 flex-col">
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
