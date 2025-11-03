"use client";

import { useUser } from "@/lib/user-context";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm w-[calc(100vw-2rem)]"
        data-control-center
      >
        <DialogHeader>
          <DialogTitle>Control Center</DialogTitle>
          <DialogDescription className="sr-only">User settings and information</DialogDescription>
        </DialogHeader>
        
        {/* User Info */}
        <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            <span className="inline-block mt-1 text-xs text-primary font-medium bg-accent px-2 py-0.5 rounded shadow-sm">
              {formatRole(user?.role ?? "")}
            </span>
          </div>
        </div>

        {/* Leave Balances - Only for non-executive roles */}
        {user?.role && user.role !== "CEO" && user.role !== "HR_HEAD" && (
          <div className="space-y-2 text-sm mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Leave Balance
            </h3>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Earned</span>
                  <span className="font-semibold text-foreground">{earned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Casual</span>
                  <span className="font-semibold text-foreground">{casual}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Medical</span>
                  <span className="font-semibold text-foreground">{medical}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Recent Notifications */}
        {notes.length > 0 && (
          <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground max-h-32 overflow-auto">
            <p className="font-semibold mb-2 text-foreground">Recent Notifications</p>
            <ul className="space-y-1">
              {notes.map((note, i) => (
                <li key={i} className="truncate flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
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
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium 
              hover:bg-primary/90 
              shadow-lg
              transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
