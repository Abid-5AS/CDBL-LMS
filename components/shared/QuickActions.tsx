"use client";

import Link from "next/link";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickAction = {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  badge?: number | string;
  tooltip?: string;
  className?: string;
};

type QuickActionsProps = {
  actions: QuickAction[];
  variant?: "buttons" | "card" | "dropdown";
  title?: string;
  className?: string;
  compact?: boolean;
};

function ActionButton({ action, compact }: { action: QuickAction; compact: boolean }) {
  const content = (
    <Button
      variant={action.variant || "outline"}
      className={cn(
        compact ? "min-w-[120px]" : "flex-1 min-w-[140px]",
        "justify-start gap-2 rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--color-card)95%,transparent)]",
        action.className
      )}
      asChild={Boolean(action.href)}
      onClick={action.href ? undefined : action.onClick}
    >
      {action.href ? (
        <Link href={action.href} className="flex items-center gap-2">
          <action.icon className="h-4 w-4" />
          {action.label}
          {action.badge && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
              {action.badge}
            </span>
          )}
        </Link>
      ) : (
        <span className="flex items-center gap-2">
          <action.icon className="h-4 w-4" />
          {action.label}
          {action.badge && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
              {action.badge}
            </span>
          )}
        </span>
      )}
    </Button>
  );

  return action.tooltip ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{action.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    content
  );
}

export function QuickActions({
  actions,
  variant = "buttons",
  title,
  className,
  compact = false,
}: QuickActionsProps) {
  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className}>
            {title || "Quick Actions"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onClick={action.href ? undefined : action.onClick}
              className="flex items-center gap-2"
            >
              {action.href ? (
                <Link href={action.href} className="flex w-full items-center gap-2">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              ) : (
                <>
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </>
              )}
              {action.badge && (
                <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                  {action.badge}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("neo-card space-y-4 px-6 py-5", className)}>
        {title && (
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Actions
            </p>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
        )}
        <div className={cn("flex flex-wrap gap-3", compact && "gap-2")}>{actions.map((action) => (
          <ActionButton key={action.label} action={action} compact={compact} />
        ))}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {actions.map((action) => (
        <ActionButton key={action.label} action={action} compact={compact} />
      ))}
    </div>
  );
}
