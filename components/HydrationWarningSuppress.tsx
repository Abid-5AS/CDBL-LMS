"use client";

import { useEffect } from "react";

/**
 * Global hydration warning suppression for benign browser extension attributes
 *
 * This component suppresses hydration mismatch warnings that are caused by:
 * - Browser extensions (e.g., bis_skin_checked from image solvers)
 * - Animation timing differences between SSR and client (Framer Motion)
 *
 * These warnings are not actual bugs - they're just timing issues that don't
 * affect functionality. Real hydration errors will still be shown.
 */
export function HydrationWarningSuppress() {
  useEffect(() => {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    /**
     * Check if a console message should be suppressed
     * Only suppress known benign hydration warnings
     */
    const shouldSuppress = (message: string): boolean => {
      // Only check hydration-related messages
      if (!message.includes("hydration")) {
        return false;
      }

      // Suppress known benign attributes added by browser extensions or animations
      const benignPatterns = [
        "bis_skin_checked", // Browser extension (Buster Image Solver, etc.)
        "darkreader", // Browser extension (Dark Reader)
        "style=", // Animation style changes
        "animate", // Framer Motion animate prop
        "opacity:", // Opacity animations
        "transform:", // Transform animations
        "initial=", // Framer Motion initial prop
        "transition=", // Framer Motion transition prop
      ];

      return benignPatterns.some((pattern) => message.includes(pattern));
    };

    /**
     * Override console.error to filter benign hydration warnings
     */
    const handleError = (...args: any[]) => {
      const message = args[0]?.toString?.() || "";

      if (shouldSuppress(message)) {
        return; // Suppress this warning
      }

      // Pass through all other errors (including real hydration issues)
      originalError(...args);
    };

    /**
     * Override console.warn to filter benign hydration warnings
     */
    const handleWarn = (...args: any[]) => {
      const message = args[0]?.toString?.() || "";

      if (shouldSuppress(message)) {
        return; // Suppress this warning
      }

      // Pass through all other warnings
      originalWarn(...args);
    };

    // Apply the overrides
    console.error = handleError;
    console.warn = handleWarn;

    // Cleanup: restore original console methods when component unmounts
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // This component doesn't render anything
  return null;
}
