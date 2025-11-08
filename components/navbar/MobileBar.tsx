"use client";

import { Menu, X } from "lucide-react";

import type { NavbarState } from "./use-navbar-state";
import { Brand } from "./Brand";

type MobileBarProps = Pick<NavbarState, "toggleMobileMenu" | "isMobileMenuOpen">;

export function MobileBar({ toggleMobileMenu, isMobileMenuOpen }: MobileBarProps) {
  return (
    <div className="flex items-center justify-between md:hidden">
      <Brand compact />
      <button
        className="rounded-md p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? (
          <X size={20} className="text-neutral-900 dark:text-neutral-50" />
        ) : (
          <Menu size={20} className="text-neutral-900 dark:text-neutral-50" />
        )}
      </button>
    </div>
  );
}
