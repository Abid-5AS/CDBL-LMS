// app/components/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui";
import { getIcon, iconSizes } from "@/lib/icons";
import { scaleIn } from "@/lib/animations";

const SunIcon = getIcon("Sun");
const MoonIcon = getIcon("Moon");

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 rounded-full bg-background/50 border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:bg-muted"
        aria-label="Toggle theme"
        disabled
      >
        <div className="size-[18px] rounded-full bg-text-tertiary/60" />
      </Button>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        className="relative h-9 w-9 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/60 transition-all duration-300 bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        <span className="sr-only">{label}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "sun" : "moon"}
            variants={scaleIn(
              { duration: prefersReducedMotion ? 0 : 0.25 },
              prefersReducedMotion ?? false
            )}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center justify-center"
          >
            {isDark ? (
              <SunIcon
                className="text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                strokeWidth={1.8}
                size={iconSizes.md}
              />
            ) : (
              <MoonIcon
                className="text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]"
                strokeWidth={1.9}
                size={iconSizes.md}
              />
            )}
          </motion.span>
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
