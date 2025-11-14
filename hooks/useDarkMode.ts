/**
 * useDarkMode Hook
 *
 * Detect and manage dark mode state
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Hook to detect dark mode state
 *
 * Returns current dark mode status based on system preference and theme setting.
 *
 * @example
 * ```typescript
 * const { isDark, systemDark, theme } = useDarkMode();
 *
 * return (
 *   <div className={isDark ? 'bg-slate-900' : 'bg-white'}>
 *     {isDark ? 'Dark Mode' : 'Light Mode'}
 *   </div>
 * );
 * ```
 */
export function useDarkMode() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode is active
  const isDark =
    mounted &&
    (theme === "dark" ||
      (theme === "system" && systemTheme === "dark"));

  // Check if system prefers dark mode
  const systemDark = mounted && systemTheme === "dark";

  return {
    /** Whether dark mode is currently enabled */
    isDark: isDark ?? false,

    /** Whether system prefers dark mode */
    systemDark: systemDark ?? false,

    /** Current theme setting ('light' | 'dark' | 'system') */
    theme: theme as "light" | "dark" | "system" | undefined,

    /** Current system theme ('light' | 'dark') */
    systemTheme: systemTheme as "light" | "dark" | undefined,

    /** Whether theme is ready (mounted) */
    mounted,
  };
}
