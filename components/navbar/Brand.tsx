"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Go to dashboard"
      className={cn(
        "flex items-center gap-2.5 group focus-ring rounded-xl transition-all duration-300",
        compact
          ? "hover:scale-[1.02]"
          : "rounded-2xl bg-muted/50 dark:bg-muted/40 px-3 py-2 shadow-[0_0_20px_rgba(0,0,0,0.03)] dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-xl border border-border dark:border-border hover:shadow-[0_0_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.04)]"
      )}
    >
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center transition-all duration-300 relative bg-background rounded-lg shadow-sm",
          compact ? "h-8 w-auto p-1" : "h-10 w-auto p-1.5"
        )}
      >
        <Image
          src="/brand/cdbl-lms.png"
          alt="CDBL LMS Logo"
          width={compact ? 120 : 140}
          height={compact ? 80 : 93}
          className="object-contain h-full w-auto"
          priority
          unoptimized
        />
      </motion.div>

      {/* Subtitle for non-compact mode */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-col"
        >
          <span className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium tracking-tight">
            Leave Management System
          </span>
        </motion.div>
      )}

      {/* Hover gradient effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-accent/5 to-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        initial={false}
      />
    </Link>
  );
}
