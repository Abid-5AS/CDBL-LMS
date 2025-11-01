"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { motion } from "framer-motion";
import clsx from "clsx";
import { LogOut } from "lucide-react";
import { getNavItemsForRole, type UserRole } from "@/lib/navigation";

export default function FloatingDock() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  if (!user) return null;

  // Get role-specific navigation items
  const navItems = getNavItemsForRole(user.role as UserRole);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-5 py-3 bg-white/70 backdrop-blur-md border border-gray-200/30 shadow-lg"
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
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:text-indigo-500 hover:bg-gray-50"
            )}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            {item.badge && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {item.label}
            </span>
          </button>
        );
      })}

      <div className="h-8 w-px bg-gray-300 mx-1" />

      <button
        onClick={handleLogout}
        aria-label="Logout"
        className="p-2.5 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 relative group"
      >
        <LogOut size={20} />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Logout
        </span>
      </button>
    </motion.div>
  );
}

