"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUser, useUserStatus } from "@/lib/user-context";
import { useSelectionCount } from "@/lib/selection-context";
import {
  getActionsForContext,
  inferPageContext,
  type PageContext,
} from "@/lib/page-context";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

type FloatingDockProps = {
  pageContext?: PageContext;
};

export default function FloatingDock({ pageContext }: FloatingDockProps) {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const status = useUserStatus();
  const selectionCount = useSelectionCount();

  if (status !== "ready") return null;
  if (!user) return null;

  // Infer page context from pathname if not provided
  const resolvedPageContext = pageContext || inferPageContext(pathname);

  // Get actions for current context, role, and selection state
  const actions = getActionsForContext(
    user.role as any,
    resolvedPageContext,
    selectionCount
  );

  // If no actions, don't render (or show minimal dock)
  if (actions.length === 0) {
    return null;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl px-2 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 glass-base transition-all duration-300"
      role="navigation"
      aria-label="Page actions"
    >
      <TooltipProvider>
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = action.href
            ? pathname === action.href || pathname.startsWith(action.href + "/")
            : false;

          const handleClick = () => {
            if (action.onClick) {
              action.onClick();
            } else if (action.href) {
              router.push(action.href);
            }
          };

          return (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleClick}
                  aria-label={action.label}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-2 p-2.5 rounded-full transition-all duration-200 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
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
                  <span className="hidden md:inline text-xs font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                  {action.badge !== undefined && action.badge > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold shadow-lg"
                      aria-label={`${action.badge} items selected`}
                    >
                      {action.badge > 99 ? "99+" : action.badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
              >
                <p className="text-xs font-semibold">{action.label}</p>
                {selectionCount > 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-0.5">
                    {selectionCount} row{selectionCount !== 1 ? "s" : ""}{" "}
                    selected
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </motion.div>
  );
}
