"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/user-context";
import { useEffect, useState } from "react";

type BalanceData = {
  earned?: number;
  casual?: number;
  medical?: number;
  EARNED?: number;
  CASUAL?: number;
  MEDICAL?: number;
};

const formatRole = (role: string) => {
  const labels: Record<string, string> = {
    EMPLOYEE: "Employee",
    DEPT_HEAD: "Department Head",
    HR_ADMIN: "HR Admin",
    HR_HEAD: "HR Head",
    CEO: "CEO"
  };
  return labels[role] || role;
};

export default function ControlCenter({ onClose }: { onClose: () => void }) {
  const user = useUser();
  const [balances, setBalances] = useState<BalanceData>({});
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch live data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch balances (only for non-executive roles)
        if (user?.role && user.role !== "CEO" && user.role !== "HR_HEAD") {
          const balanceRes = await fetch("/api/balance/mine");
          if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            setBalances(balanceData);
          }
        }

        // Fetch notifications (stub)
        const notesRes = await fetch("/api/notifications/latest");
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(Array.isArray(notesData) ? notesData : []);
        }
      } catch (error) {
        console.error("Failed to fetch ControlCenter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-control-center]')) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleLogout = async () => {
    onClose();
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    window.location.assign("/login");
  };

  // Normalize balance data (handle both uppercase and lowercase keys)
  const earned = balances.earned ?? balances.EARNED ?? 0;
  const casual = balances.casual ?? balances.CASUAL ?? 0;
  const medical = balances.medical ?? balances.MEDICAL ?? 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -8 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="fixed right-6 top-[64px] w-72 rounded-2xl z-50 overflow-hidden backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/30 dark:border-white/10 shadow-xl dark:shadow-2xl"
        data-control-center
        role="dialog"
        aria-modal="true"
        aria-label="Control Center"
      >
        {/* Dark overlay for better text readability */}
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        />
        
        {/* Glass shine overlay */}
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none z-0"
          style={{
            background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 100%)",
          }}
        />
        
        {/* Content wrapper with blur effect */}
        <div 
          className="relative z-10 p-4 backdrop-blur-sm" 
          style={{ 
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* User Info */}
          <div className="flex items-center gap-3 border-b border-gray-200/40 dark:border-gray-700/40 pb-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate drop-shadow-sm">{user?.name ?? "User"}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user?.email ?? ""}</p>
              <span className="inline-block mt-1 text-xs text-indigo-700 dark:text-indigo-400 font-medium bg-indigo-50/90 dark:bg-indigo-500/20 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
                {formatRole(user?.role ?? "")}
              </span>
            </div>
          </div>

          {/* Leave Balances - Only for non-executive roles */}
          {user?.role && user.role !== "CEO" && user.role !== "HR_HEAD" && (
            <div className="space-y-2 text-sm mb-3">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 drop-shadow-sm">
                Leave Balance
              </h3>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200/80 dark:bg-gray-700/60 rounded animate-pulse backdrop-blur-sm" />
                  <div className="h-4 bg-gray-200/80 dark:bg-gray-700/60 rounded animate-pulse backdrop-blur-sm" />
                  <div className="h-4 bg-gray-200/80 dark:bg-gray-700/60 rounded animate-pulse backdrop-blur-sm" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 dark:text-gray-200 drop-shadow-sm">Earned</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 drop-shadow-sm">{earned}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 dark:text-gray-200 drop-shadow-sm">Casual</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 drop-shadow-sm">{casual}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 dark:text-gray-200 drop-shadow-sm">Medical</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 drop-shadow-sm">{medical}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Recent Notifications */}
          {notes.length > 0 && (
            <div className="mt-3 border-t border-gray-200/40 dark:border-gray-700/40 pt-3 text-xs text-gray-700 dark:text-gray-300 max-h-32 overflow-auto soft-scrollbar">
              <p className="font-semibold mb-2 text-gray-800 dark:text-gray-200 drop-shadow-sm">Recent Notifications</p>
              <ul className="space-y-1">
                {notes.map((note, i) => (
                  <li key={i} className="truncate flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 mt-0.5 drop-shadow-sm">•</span>
                    <span className="drop-shadow-sm">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Logout Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleLogout}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 text-sm font-medium 
                hover:from-indigo-700 hover:to-indigo-800 
                shadow-lg shadow-indigo-500/30
                transition-all duration-200 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent
                backdrop-blur-sm"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

