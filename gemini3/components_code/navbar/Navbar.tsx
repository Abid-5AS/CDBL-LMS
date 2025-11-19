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
          height: state.scrolled ? 64 : 72, // Reduced height for a more compact look
        }}
        transition={{
          duration: 0.4,
          height: { duration: 0.3, ease: "easeInOut" },
        }}
        className={cn(
          "fixed top-0 z-50 w-full border-b border-border",
          "bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80", // Modern glass effect
          state.scrolled && "shadow-sm"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="relative mx-auto flex h-full w-full max-w-7xl min-w-0 flex-col justify-center">
          <DesktopNav {...state} />
          <MobileBar {...state} />
        </div>
      </motion.nav>

      <AnimatePresence>
        {state.isMobileMenuOpen && <MobileMenu {...state} />}
      </AnimatePresence>
    </div>
  );
}
