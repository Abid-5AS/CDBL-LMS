"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type NavItem } from "@/lib/navigation";

interface DropdownNavItemProps {
  icon: React.ElementType;
  label: string;
  items: NavItem[];
  isActive: (href: string) => boolean;
  className?: string;
}

export function DropdownNavItem({
  icon: Icon,
  label,
  items,
  isActive,
  className,
}: DropdownNavItemProps) {
  const hasActiveChild = items.some((item) => isActive(item.href));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200",
            hasActiveChild
              ? "bg-surface-2 text-foreground"
              : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            className
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="hidden xl:inline whitespace-nowrap font-medium">
            {label}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items.map((item) => {
          const ItemIcon = item.icon;
          const active = isActive(item.href);
          return (
            <DropdownMenuItem
              key={item.href}
              asChild
              className={cn(active && "bg-accent text-accent-foreground")}
            >
              <a href={item.href}>
                <ItemIcon className="mr-2 h-4 w-4" />
                {item.label}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}