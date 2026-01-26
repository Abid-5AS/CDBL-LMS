"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Hexagon, Layers } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Go to dashboard"
      className={cn(
        "flex items-center gap-3 focus-ring rounded-xl transition-opacity hover:opacity-90",
        compact ? "py-1.5" : "py-2"
      )}
    >
      {/* Icon Logo */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        <div className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/25",
          compact ? "h-8 w-8" : "h-10 w-10"
        )}>
          <Hexagon className={cn("fill-white/10 stroke-[2.5px]", compact ? "h-5 w-5" : "h-6 w-6")} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Layers className={cn("text-white/90", compact ? "h-3 w-3" : "h-4 w-4")} />
          </div>
        </div>
      </div>

      {/* Text Logo */}
      <div className={cn("flex flex-col", compact && "hidden sm:flex")}>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(
            "font-bold tracking-tight text-foreground",
            compact ? "text-lg" : "text-xl"
          )}>
            CDBL
          </span>
          <span className={cn(
            "font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500",
            compact ? "text-sm" : "text-base"
          )}>
            LMS
          </span>
        </div>
        {!compact && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 leading-3">
            Leave Management
          </span>
        )}
      </div>
    </Link>
  );
}
