"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  disabled?: boolean;
  ariaLabel?: string;
};

type QuickActionsProps = {
  actions: QuickAction[];
  className?: string;
};

/**
 * Horizontal pill-style quick action buttons with icons
 * Material 3 style with smooth animations
 */
export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className
      )}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.2,
              delay: index * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              aria-label={action.ariaLabel || action.label}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                "hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}


