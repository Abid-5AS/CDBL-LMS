"use client";

import * as React from "react";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

export interface BreadcrumbAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  actions?: BreadcrumbAction[];
  className?: string;
  maxItems?: number;
  showHome?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

// Traditional shadcn/ui breadcrumb components for backward compatibility
export function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      className={cn("flex items-center gap-1 min-w-0", className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return <li className={cn("min-w-0", className)} {...props} />;
}

export function BreadcrumbLink({
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors focus-ring max-w-[200px] truncate",
        className
      )}
      {...props}
    />
  );
}

export function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 text-sm text-foreground font-medium rounded-lg max-w-[200px] truncate",
        className
      )}
      aria-current="page"
      {...props}
    />
  );
}

export function BreadcrumbSeparator({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li aria-hidden="true" className={cn("", className)} {...props}>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
    </li>
  );
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("flex items-center justify-center", className)}
      aria-hidden="true"
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
    </span>
  );
}

export function Breadcrumb({
  items,
  actions = [],
  className,
  maxItems = 4,
  showHome = true,
}: BreadcrumbProps) {
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    // Show first item, ellipsis, and last few items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 2));

    return [
      firstItem,
      { label: "...", href: undefined, isEllipsis: true },
      ...lastItems,
    ];
  }, [items, maxItems]);

  const collapsedItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return [];
    }
    return items.slice(1, -(maxItems - 2));
  }, [items, maxItems]);

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0">
        <ol className="flex items-center gap-1 min-w-0">
          {/* Home Link */}
          {showHome && (
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors focus-ring"
                aria-label="Go to dashboard"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
          )}

          {/* Breadcrumb Items */}
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const Icon = item.icon;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {/* Separator */}
                {(showHome || index > 0) && (
                  <li aria-hidden="true">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                  </li>
                )}

                <li className="min-w-0">
                  {item.isEllipsis ? (
                    // Ellipsis with dropdown for collapsed items
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {collapsedItems.map((collapsedItem, collapsedIndex) => (
                          <DropdownMenuItem key={collapsedIndex} asChild>
                            {collapsedItem.href ? (
                              <Link href={collapsedItem.href}>
                                {collapsedItem.icon && (
                                  <collapsedItem.icon className="h-4 w-4 mr-2" />
                                )}
                                {collapsedItem.label}
                              </Link>
                            ) : (
                              <span>
                                {collapsedItem.icon && (
                                  <collapsedItem.icon className="h-4 w-4 mr-2" />
                                )}
                                {collapsedItem.label}
                              </span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      {item.href && !isLast ? (
                        <Link
                          href={item.href}
                          className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors focus-ring max-w-[200px] truncate"
                        >
                          {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                          <span className="truncate">{item.label}</span>
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-lg max-w-[200px] truncate",
                            isLast
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          )}
                          aria-current={isLast ? "page" : undefined}
                        >
                          {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                          <span className="truncate">{item.label}</span>
                        </span>
                      )}
                    </motion.div>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      {/* Contextual Actions */}
      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 flex-shrink-0"
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex items-center gap-2"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// Hook to generate breadcrumbs from pathname
export function useBreadcrumbs() {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Build breadcrumbs based on route segments
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Map segments to readable labels
      let label = segment;
      let icon: React.ComponentType<{ className?: string }> | undefined;

      switch (segment) {
        case "dashboard":
          label = "Dashboard";
          break;
        case "leaves":
          label = "Leaves";
          break;
        case "apply":
          label = "Apply Leave";
          break;
        case "my":
          label = "My Leaves";
          break;
        case "balance":
          label = "Leave Balance";
          break;
        case "employees":
          label = "Employees";
          break;
        case "reports":
          label = "Reports";
          break;
        case "settings":
          label = "Settings";
          break;
        case "approvals":
          label = "Approvals";
          break;
        case "holidays":
          label = "Holidays";
          break;
        case "policies":
          label = "Policies";
          break;
        case "admin":
          label = "Admin";
          break;
        case "hr-head":
          label = "HR Head";
          break;
        case "manager":
          label = "Manager";
          break;
        case "ceo":
          label = "CEO";
          break;
        default:
          // Try to format the segment nicely
          label = segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
      }

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        icon,
        current: isLast,
      });
    });

    return breadcrumbs;
  }, [pathname]);
}
