"use client";

import { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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

/**
 * Unified QuickActions Component
 * Consolidates QuickActions, QuickActionsCard, DeptHeadQuickActions, HRQuickActions
 * Supports multiple display variants: buttons, card, dropdown
 */
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
          {actions.map((action, index) => {
            const Icon = action.icon;
            if (action.href) {
              return (
                <DropdownMenuItem key={index} asChild>
                  <Link href={action.href} className="flex items-center">
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                    {action.badge && (
                      <Badge variant="destructive" className="ml-auto">
                        {action.badge}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            }
            return (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                className="flex items-center"
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
                {action.badge && (
                  <Badge variant="destructive" className="ml-auto">
                    {action.badge}
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "card") {
    return (
      <Card className={cn("rounded-2xl border-muted/60 shadow-sm", className)}>
        {title && (
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={cn("flex flex-wrap gap-2", compact && "gap-1")}>
            {actions.map((action, index) => {
              const Icon = action.icon;
              const button = (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  className={cn(
                    compact ? "min-w-[120px]" : "flex-1 min-w-[140px]",
                    "justify-start gap-2",
                    action.className
                  )}
                  onClick={action.onClick}
                  asChild={!!action.href}
                >
                  {action.href ? (
                    <Link href={action.href}>
                      <Icon className="h-4 w-4" />
                      {action.label}
                      {action.badge && (
                        <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </Link>
                  ) : (
                    <>
                      <Icon className="h-4 w-4" />
                      {action.label}
                      {action.badge && (
                        <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              );

              if (action.tooltip) {
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent>{action.tooltip}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return button;
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: buttons variant
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        const button = (
          <Button
            key={index}
            variant={action.variant || "default"}
            className={cn(
              "relative rounded-full px-4 py-2 font-medium transition-all ease-out duration-300",
              action.className
            )}
            onClick={action.onClick}
            asChild={!!action.href}
          >
            {action.href ? (
              <Link href={action.href}>
                <Icon className="h-4 w-4 mr-2" />
                {action.label}
                {action.badge && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                    {action.badge}
                  </Badge>
                )}
              </Link>
            ) : (
              <>
                <Icon className="h-4 w-4 mr-2" />
                {action.label}
                {action.badge && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                    {action.badge}
                  </Badge>
                )}
              </>
            )}
          </Button>
        );

        if (action.tooltip) {
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent>{action.tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return button;
      })}
    </div>
  );
}

