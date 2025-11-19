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
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg shadow-black/10 hover:border-primary/40 transition-all text-left w-64"
            aria-label={action.label}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.accent}`}
            >
              <Icon className="size-5" />
            </span>
            <div className="flex flex-col text-sm">
              <span className="font-semibold text-foreground">{action.label}</span>
              <span className="text-xs text-muted-foreground">
                {action.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
