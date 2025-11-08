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
        className="h-9 w-9 rounded-xl bg-muted/40 backdrop-blur-sm"
        aria-label="Toggle theme"
        disabled
      >
        <div className="size-[18px] rounded-full bg-text-tertiary/60" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className="relative h-9 w-9 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-card-action/40"
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
              className="text-amber-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.55)]"
              strokeWidth={1.8}
              size={iconSizes.md}
            />
          ) : (
            <MoonIcon
              className="text-indigo-500 dark:text-indigo-300 drop-shadow-[0_0_6px_rgba(99,102,241,0.55)]"
              strokeWidth={1.9}
              size={iconSizes.md}
            />
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
