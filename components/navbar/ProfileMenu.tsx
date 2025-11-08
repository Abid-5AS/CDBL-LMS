"use client";

import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavbarState } from "./use-navbar-state";

type ProfileMenuProps = {
  user: NonNullable<NavbarState["user"]>;
  onLogout: () => void;
};

export function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-9 w-9 rounded-full transition-colors hover:bg-bg-primary/50 dark:hover:bg-bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-card-action/40"
          aria-label="User profile"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-card-action to-card-summary text-text-inverted font-bold text-xs">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-data-error focus:text-data-error dark:text-data-error dark:focus:text-data-error"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
