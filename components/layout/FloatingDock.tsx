"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUser, useUserStatus } from "@/lib/user-context";
import { motion } from "framer-motion";
import clsx from "clsx";
import { LogOut } from "lucide-react";
import { getNavItemsForRole, type UserRole } from "@/lib/navigation";

export default function FloatingDock() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const status = useUserStatus();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.assign("/login");
  };

  if (status !== "ready") return null;
  if (!user) return null;

  // Get role-specific navigation items
  const navItems = getNavItemsForRole(user.role as UserRole);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-5 py-3 glass-base"
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "p-2.5 rounded-full transition-all duration-200 relative group",
              isActive
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20"
                : "text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            )}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            {item.badge && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white dark:text-gray-100 bg-gray-900 dark:bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none glass-light">
              {item.label}
            </span>
          </button>
        );
      })}

      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={handleLogout}
        aria-label="Logout"
        className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all duration-200 relative group"
      >
        <LogOut size={20} />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white dark:text-gray-100 bg-gray-900 dark:bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none glass-light">
          Logout
        </span>
      </button>
    </motion.div>
  );
}

