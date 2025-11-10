"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {th
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center transition-all duration-200 relative bg-white rounded-lg p-1.5 shadow-sm",
          compact ? "h-10 w-auto" : "h-12 w-auto"
        )}
      >
        <Image
          src="/brand/cdbl-lms.png"
          alt="CDBL LMS Logo"
          width={compact ? 150 : 180}
          height={compact ? 100 : 120}
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
          <span className="text-xs text-muted-foreground font-medium">
            Leave Management System
          </span>
        </motion.div>
      )}

      {/* Hover effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"
        initial={false}
      />
    </Link>
  );
}
