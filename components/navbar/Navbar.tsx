"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import { DesktopNav } from "./DesktopNav";
import { MobileBar } from "./MobileBar";
import { MobileMenu } from "./MobileMenu";
import { useNavbarState } from "./use-navbar-state";

export function Navbar() {
  const state = useNavbarState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!state.user || !mounted) return null;

  return (
    <>
      <motion.nav
        key="navbar"
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          height: state.scrolled ? 72 : 84,
        }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
          height: { duration: 0.3, ease: "easeInOut" },
        }}
        className="fixed top-0 z-50 w-full backdrop-blur-md bg-white/40 dark:bg-black/40"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Content container */}
        <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-4">
          <DesktopNav {...state} />
          <MobileBar {...state} />
        </div>

        {/* Bottom border with gradient */}
        <motion.div
          key="border"
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200/50 dark:via-white/10 to-transparent"
          animate={{
            opacity: state.scrolled ? 1 : 0.5,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </motion.nav>

      <AnimatePresence>
        {state.isMobileMenuOpen && <MobileMenu {...state} />}
      </AnimatePresence>
    </>
  );
}
