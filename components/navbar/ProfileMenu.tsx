"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Settings,
  User,
  FileText,
  Calendar,
  BarChart3,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavbarState } from "./use-navbar-state";

type ProfileMenuProps = {
  user: NonNullable<NavbarState["user"]>;
  onLogout: () => void;
};

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Role-based badge
  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      CEO: { label: "CEO", color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10 border-amber-500/10" },
      HR_HEAD: { label: "HR Head", color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10 border-orange-500/10" },
      HR_ADMIN: { label: "HR Admin", color: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10 border-purple-500/10" },
      DEPT_HEAD: { label: "Manager", color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-500/10" },
      SYSTEM_ADMIN: { label: "Admin", color: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10 border-red-500/10" },
      EMPLOYEE: { label: "Employee", color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 border-blue-500/10" },
    };
    return badges[role] || badges.EMPLOYEE;
  };

  const roleBadge = getRoleBadge(user.role);

  const menuItems: MenuItem[] = [
    {
      label: "Profile",
      href: "/settings",
      icon: <User className="w-4 h-4" />,
    },
    {
      label: "My Leaves",
      href: "/leaves/my",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      label: "Leave Balance",
      href: "/balance",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      label: "Policies",
      href: "/policies",
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  // Get user initials for avatar
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <div className="relative">
      <DropdownMenu onOpenChange={setIsOpen}>
        <div className="group relative">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 hover:shadow-sm transition-all duration-200 focus:outline-none focus-ring"
            >
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 tracking-tight leading-tight">
                  {user.department || user.role}
                </div>
              </div>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {initials}
                  </div>
                </div>
              </div>
            </button>
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
                  ? "text-blue-500 dark:text-blue-400 scale-110"
                  : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
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
            className="w-64 p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-xl shadow-zinc-900/5 dark:shadow-zinc-950/20 
                    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 origin-top-right"
          >
            {/* User Info Header */}
            <div className="px-3 py-3 mb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5 flex-shrink-0">
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
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
                    className="flex items-center p-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-sm border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight whitespace-nowrap group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="my-2 bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />

            <DropdownMenuItem asChild>
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-3 duration-200 bg-red-500/10 rounded-xl hover:bg-red-500/20 cursor-pointer border border-transparent hover:border-red-500/30 hover:shadow-sm transition-all group"
              >
                <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
                <span className="text-sm font-medium text-red-500 group-hover:text-red-600 transition-colors">
                  Sign Out
                </span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </div>
  );
}
