"use client";

import Link from "next/link";
import clsx from "clsx";

import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

import type { NavbarState } from "./use-navbar-state";
import { Brand } from "./Brand";
import { ProfileMenu } from "./ProfileMenu";

type DesktopNavProps = Pick<
  NavbarState,
  "user" | "router" | "navLinks" | "isActive"
>;

export function DesktopNav({
  user,
  router,
  navLinks,
  isActive,
}: DesktopNavProps) {
  if (!user) return null;

  return (
    <div className="hidden items-center justify-between md:flex">
      <Brand />
      <div className="glass-pill rounded-full px-4 py-2 shadow-md backdrop-blur-sm">
        <ul className="flex items-center gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                    active
                      ? "bg-white/60 text-indigo-600 dark:bg-white/10 dark:text-indigo-400"
                      : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="glass-pill flex items-center gap-2 rounded-full p-2 shadow-md backdrop-blur-sm">
        <NotificationDropdown />
        <ThemeToggle />
        <ProfileMenu
          user={user}
          onLogout={() => router.push("/api/auth/logout")}
        />
      </div>
    </div>
  );
}
