"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

type FloatingAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  onClick: () => void;
};

type FloatingQuickActionsProps = {
  actions: FloatingAction[];
};

export function FloatingQuickActions({ actions }: FloatingQuickActionsProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40 hidden lg:flex flex-col gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="group relative h-14 w-14 rounded-2xl border border-border bg-card shadow-lg shadow-black/10 hover:border-primary/40 transition-all"
            aria-label={action.label}
          >
            <span
              className={`absolute inset-0 rounded-2xl ${action.accent} flex items-center justify-center transition-all group-hover:scale-105`}
            >
              <Icon className="size-5" />
            </span>
            <span className="absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-card border border-border px-3 py-2 rounded-lg shadow-lg text-sm font-medium pointer-events-none">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
