"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUser, useUserStatus } from "@/lib/user-context";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  LogOut,
  PlaneTakeoff,
  ClipboardList,
  CalendarDays,
  UserRound,
  ClipboardCheck,
  Users,
  BarChart2,
  Settings,
  FileText,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

type DockItem = {
  label: string;
  href: string;
  icon: typeof PlaneTakeoff;
};

// Context-aware dock items based on role
const getDockItems = (role: string): DockItem[] => {
  switch (role) {
    case "EMPLOYEE":
      return [
        {
          label: "Apply Leave",
          href: "/leaves/apply",
          icon: PlaneTakeoff,
        },
        {
          label: "Leave Requests",
          href: "/leaves",
          icon: ClipboardList,
        },
      ];
    case "HR_ADMIN":
    case "HR_HEAD":
      return [
        {
          label: "Approvals",
          href: "/approvals",
          icon: ClipboardCheck,
        },
        { label: "Employees", href: "/employees", icon: Users },
        { label: "Audit Logs", href: "/admin/audit", icon: FileText },
      ];
    case "DEPT_HEAD":
      return [
        {
          label: "Team Requests",
          href: "/approvals",
          icon: ClipboardCheck,
        },
        {
          label: "Team Calendar",
          href: "/holidays",
          icon: CalendarDays,
        },
      ];
    case "CEO":
      return [
        {
          label: "Insights",
          href: "/dashboard",
          icon: BarChart2,
        },
        { label: "Reports", href: "/reports", icon: FileText },
      ];
    default:
      return [
        {
          label: "Apply Leave",
          href: "/leaves/apply",
          icon: PlaneTakeoff,
        },
        {
          label: "Leave Requests",
          href: "/leaves",
          icon: ClipboardList,
        },
      ];
  }
};

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

  const dockItems = getDockItems(user.role);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 glass-base shadow-xl hover:shadow-2xl transition-all duration-300"
      role="navigation"
      aria-label="Quick actions"
      style={{
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
      }}
    >
      <TooltipProvider>
        {dockItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push(item.href)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "p-2.5 rounded-full transition-all duration-200 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                    "hover:scale-[1.05] active:scale-[0.95]",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 shadow-lg ring-2 ring-indigo-500/20 dark:ring-indigo-400/30"
                      : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/20 dark:hover:bg-white/5"
                  )}
                  style={
                    isActive
                      ? {
                          color: "oklch(70% 0.1 250)",
                        }
                      : undefined
                  }
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="glass-medium backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
                style={{
                  backgroundColor: "rgba(15, 15, 20, 0.9)",
                  color: "oklch(95% 0.03 250)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  boxShadow:
                    "0 0 12px rgba(255, 255, 255, 0.05), 0 8px 16px rgba(0, 0, 0, 0.3)",
                }}
              >
                <p className="text-xs font-semibold">{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>

      <div className="h-8 w-px bg-gray-300/50 dark:bg-gray-600/50 mx-1" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="p-2.5 rounded-full text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/30 dark:hover:bg-red-500/20 transition-all duration-200 relative group hover:scale-[1.05] active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <LogOut size={20} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="glass-medium backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
            style={{
              backgroundColor: "rgba(15, 15, 20, 0.9)",
              color: "oklch(95% 0.03 250)",
              padding: "6px 12px",
              borderRadius: "8px",
              boxShadow:
                "0 0 12px rgba(255, 255, 255, 0.05), 0 8px 16px rgba(0, 0, 0, 0.3)",
            }}
          >
            <p className="text-xs font-semibold">Logout</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
