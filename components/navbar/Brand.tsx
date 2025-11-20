"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Go to dashboard"
      className={cn(
        "flex items-center gap-2.5 focus-ring rounded-xl border border-outline/60 dark:border-border bg-surface-1 px-3 py-2 shadow-card",
        compact && "px-2 py-1.5"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center bg-transparent",
          compact ? "h-8 w-auto" : "h-10 w-auto"
        )}
      >
        <Image
          src="/brand/company-logo.png"
          alt="Central Depository Bangladesh Limited"
          width={compact ? 120 : 140}
          height={compact ? 80 : 90}
          className="object-contain h-full w-auto"
          priority
          unoptimized
        />
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground font-medium tracking-tight">
            Leave Management System
          </span>
        </div>
      )}
    </Link>
  );
}
