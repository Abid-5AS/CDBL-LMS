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
    window.location.href = "/login";
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
        className="absolute right-0 top-14 w-72 rounded-2xl bg-white/70 backdrop-blur-xl border border-gray-200/40 p-4 shadow-xl z-50"
        data-control-center
        role="dialog"
        aria-modal="true"
        aria-label="Control Center"
      >
        {/* User Info */}
        <div className="flex items-center gap-3 border-b border-gray-200/60 pb-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email ?? ""}</p>
            <span className="inline-block mt-1 text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">
              {formatRole(user?.role ?? "")}
            </span>
          </div>
        </div>

        {/* Leave Balances - Only for non-executive roles */}
        {user?.role && user.role !== "CEO" && user.role !== "HR_HEAD" && (
          <div className="space-y-2 text-sm mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Leave Balance
            </h3>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Earned</span>
                  <span className="font-semibold text-gray-900">{earned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Casual</span>
                  <span className="font-semibold text-gray-900">{casual}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Medical</span>
                  <span className="font-semibold text-gray-900">{medical}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Recent Notifications */}
        {notes.length > 0 && (
          <div className="mt-3 border-t border-gray-200/60 pt-3 text-xs text-gray-600 max-h-32 overflow-auto soft-scrollbar">
            <p className="font-semibold mb-2 text-gray-700">Recent Notifications</p>
            <ul className="space-y-1">
              {notes.map((note, i) => (
                <li key={i} className="truncate flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleLogout}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

