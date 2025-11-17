"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Settings,
  HelpCircle,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { NavbarState } from "./use-navbar-state";

type ProfileMenuProps = {
  user: NonNullable<NavbarState["user"]>;
  onLogout: () => void | Promise<void>;
  isLoggingOut?: boolean;
};

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export function ProfileMenu({ user, onLogout, isLoggingOut }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Role-based badge
  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      CEO: {
        label: "CEO",
        color:
          "text-role-ceo-accent bg-role-ceo-accent-soft border-role-ceo-accent",
      },
      HR_HEAD: {
        label: "HR Head",
        color:
          "text-role-hr-head-accent bg-role-hr-head-accent-soft border-role-hr-head-accent",
      },
      HR_ADMIN: {
        label: "HR Admin",
        color:
          "text-role-hr-admin-accent bg-role-hr-admin-accent-soft border-role-hr-admin-accent",
      },
      DEPT_HEAD: {
        label: "Manager",
        color:
          "text-role-dept-head-accent bg-role-dept-head-accent-soft border-role-dept-head-accent",
      },
      SYSTEM_ADMIN: {
        label: "Admin",
        color:
          "text-destructive bg-destructive/10 border-destructive/20",
      },
      EMPLOYEE: {
        label: "Employee",
        color:
          "text-role-employee-accent bg-role-employee-accent-soft border-role-employee-accent",
      },
    };
    return badges[role] || badges.EMPLOYEE;
  };

  const roleBadge = getRoleBadge(user.role);

  const menuItems: MenuItem[] = [
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="size-4" aria-hidden="true" />,
    },
    {
      label: "Help",
      href: "/help",
      icon: <HelpCircle className="size-4" aria-hidden="true" />,
    },
  ];

  // Get user initials for avatar
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsOpen(false);
    void onLogout();
  };

  return (
    <div className="relative">
      <DropdownMenu onOpenChange={setIsOpen}>
        <div className="group relative">
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl bg-background/80 dark:bg-muted/60 border border-border hover:border-border-strong hover:bg-background dark:hover:bg-muted hover:shadow-md transition-all duration-300 focus:outline-none focus-ring"
            >
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-semibold text-foreground tracking-tight leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-muted-foreground tracking-tight leading-tight">
                  {user.department || user.role}
                </div>
              </div>
              <div className="relative">
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent p-0.5 shadow-md"
                >
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-background dark:bg-muted text-xs font-bold text-foreground">
                    {initials}
                  </div>
                </motion.div>
              </div>
            </motion.button>
          </DropdownMenuTrigger>

          {/* Bending line indicator */}
          <div
            className={cn(
              "absolute -right-2 top-1/2 -translate-y-1/2 transition-all duration-200 hidden sm:block",
              isOpen ? "opacity-100" : "opacity-60 group-hover:opacity-100"
            )}
          >
            <svg
              width="10"
              height="20"
              viewBox="0 0 12 24"
              fill="none"
              className={cn(
                "transition-all duration-200",
                isOpen
                  ? "text-primary dark:text-primary scale-110"
                  : "text-muted-foreground dark:text-muted-foreground group-hover:text-foreground dark:group-hover:text-foreground"
              )}
              aria-hidden="true"
            >
              <path
                d="M2 4C6 8 6 16 2 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 p-2 bg-background/95 dark:bg-muted/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl shadow-foreground/5 dark:shadow-background/20 
                    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 origin-top-right"
          >
            {/* User Info Header */}
            <div className="px-3 py-3 mb-2 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent p-0.5 flex-shrink-0">
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-background dark:bg-muted text-sm font-bold text-foreground">
                    {initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <span
                    className={cn(
                      "inline-block mt-1 text-[10px] font-medium rounded-md py-0.5 px-2 tracking-tight border",
                      roleBadge.color
                    )}
                  >
                    {roleBadge.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {menuItems.map((item) => (
                <DropdownMenuItem key={item.label} asChild>
                  <Link
                    href={item.href}
                    className="flex items-center p-3 hover:bg-muted/80 dark:hover:bg-muted/60 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-sm border border-transparent hover:border-border/50"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium text-foreground tracking-tight leading-tight whitespace-nowrap group-hover:text-foreground transition-colors">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="my-2 bg-gradient-to-r from-transparent via-border to-transparent" />

            <DropdownMenuItem asChild>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
                className="w-full flex items-center gap-3 p-3 duration-200 bg-destructive/10 rounded-xl hover:bg-destructive/20 cursor-pointer border border-transparent hover:border-destructive/30 hover:shadow-sm transition-all group disabled:opacity-60 disabled:pointer-events-none"
              >
                <LogOut className="size-4 text-destructive group-hover:text-destructive/80 transition-colors" aria-hidden="true" />
                <span className="text-sm font-medium text-destructive group-hover:text-destructive/80 transition-colors">
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </div>
  );
}
