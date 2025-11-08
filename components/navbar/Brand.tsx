"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Go to dashboard"
      className={cn(
        "flex items-center gap-3 group focus-ring rounded-full transition-all duration-200",
        compact
          ? "hover-lift"
          : "glass-pill p-2.5 shadow-lg backdrop-blur-md border border-white/20 dark:border-white/10 hover-lift"
      )}
    >
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground font-bold shadow-lg transition-all duration-200",
          compact
            ? "h-8 w-8 rounded-lg text-sm"
            : "h-10 w-10 rounded-xl text-base"
        )}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          CDBL
        </motion.span>
      </motion.div>

      {/* Brand Text */}
      <div className="flex flex-col">
        {!compact && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-lg font-bold text-foreground transition-colors group-hover:text-primary"
          >
            CDBL LMS
          </motion.span>
        )}
        {compact && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-base font-semibold text-foreground transition-colors group-hover:text-primary"
          >
            CDBL Leave
          </motion.span>
        )}

        {!compact && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="text-xs text-muted-foreground font-medium"
          >
            Leave Management
          </motion.span>
        )}
      </div>

      {/* Hover effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"
        initial={false}
      />
    </Link>
  );
}
