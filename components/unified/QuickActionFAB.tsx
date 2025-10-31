"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Plus, Eye, TrendingUp, X } from "lucide-react";
import useSWR from "swr";

type FABAction = {
  label: string;
  icon: typeof Plus;
  href: string;
  badge?: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function QuickActionFAB() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fab-open-state");
      return stored === "true";
    }
    return false;
  });
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fab-open-state", String(isOpen));
    }
  }, [isOpen]);

  // Fetch pending requests for context
  const { data: leavesData } = useSWR("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });

  const pendingCount = Array.isArray(leavesData?.items)
    ? leavesData.items.filter((item: { status: string }) => 
        item.status === "SUBMITTED" || item.status === "PENDING"
      ).length
    : 0;

  // Context-aware actions based on current page
  const actions: FABAction[] = [];
  
  if (pathname === "/dashboard") {
    actions.push(
      { label: "Apply Leave", icon: Plus, href: "/leaves/apply" },
      { label: "Track Status", icon: Eye, href: "/leaves" },
      { label: "View Balance", icon: TrendingUp, href: "/dashboard" }
    );
  } else if (pathname === "/leaves" || pathname.startsWith("/leaves/")) {
    actions.push(
      { label: "Apply Leave", icon: Plus, href: "/leaves/apply" }
    );
    if (pendingCount > 0) {
      actions.push(
        { label: "View Requests", icon: Eye, href: "/leaves", badge: pendingCount }
      );
    }
  } else if (pathname === "/leaves/apply") {
    // Hide FAB on apply page
    return null;
  } else {
    // Default actions for other pages
    actions.push(
      { label: "Apply Leave", icon: Plus, href: "/leaves/apply" },
      { label: "Dashboard", icon: Eye, href: "/dashboard" }
    );
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Secondary Actions */}
      {isOpen && (
        <div
          className="absolute bottom-20 right-0 flex flex-col gap-3"
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-lg border border-gray-200",
                  "hover:scale-105 transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2",
                  "opacity-0 animate-in fade-in slide-in-from-bottom-2"
                )}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "forwards"
                }}
                onClick={() => setIsOpen(false)}
                aria-label={`${action.label}${action.badge ? ` (${action.badge} pending)` : ""}`}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{action.label}</span>
                {action.badge && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-semibold">
                    {action.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center justify-center h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg",
          "hover:bg-indigo-700 active:scale-95 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2",
          "z-50 relative"
        )}
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}

