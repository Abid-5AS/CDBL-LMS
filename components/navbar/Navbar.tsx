"use client";

import { motion } from "framer-motion";

import { DesktopNav } from "./DesktopNav";
import { MobileBar } from "./MobileBar";
import { MobileMenu } from "./MobileMenu";
import { useNavbarState } from "./use-navbar-state";

export function Navbar() {
  const state = useNavbarState();
  if (!state.user) return null;

  return (
    <motion.nav
      animate={{ height: state.scrolled ? 60 : 72 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 z-50 w-full"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-4">
        <DesktopNav {...state} />
        <MobileBar {...state} />
      </div>
      <MobileMenu {...state} />
    </motion.nav>
  );
}
