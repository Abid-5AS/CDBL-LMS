"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Go to dashboard"
      className={cn("flex items-center gap-2 group", compact ? "" : "glass-pill rounded-full p-2 shadow-md backdrop-blur-sm")}
    >
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold shadow-md",
          compact ? "h-8 w-8 rounded-lg text-sm" : "h-9 w-9 rounded-xl text-sm",
        )}
      >
        CDBL
      </div>
      {!compact && (
        <span className="text-xl font-bold text-neutral-900 transition-colors group-hover:text-indigo-600 dark:text-neutral-50 dark:group-hover:text-indigo-400">
          CDBL LMS
        </span>
      )}
      {compact && (
        <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          CDBL Leave
        </span>
      )}
    </Link>
  );
}
