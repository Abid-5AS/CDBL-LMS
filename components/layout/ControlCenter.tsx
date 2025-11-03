"use client";

import { useUser } from "@/lib/user-context";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plane, Clock, LogOut, FileText, User, Calendar, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import useSWR from "swr";

type BalanceData = {
  earned?: number;
  casual?: number;
  medical?: number;
  EARNED?: number;
  CASUAL?: number;
  MEDICAL?: number;
};

type LeaveItem = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TabValue = "balance" | "actions" | "recent";

export default function ControlCenter({ onClose }: { onClose: () => void }) {
  const user = useUser();
  const router = useRouter();
  const [balances, setBalances] = useState<BalanceData>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("balance");

  // Fetch recent leaves
  const { data: leavesData } = useSWR<{ items: LeaveItem[] }>(
    user?.role && user.role !== "CEO" && user.role !== "HR_HEAD" 
      ? "/api/leaves?mine=1" 
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

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

  // Process recent leaves
  const recentLeaves = useMemo(() => {
    if (!leavesData?.items) return [];
    return leavesData.items
      .slice(0, 5)
      .map((leave) => ({
        ...leave,
        statusIcon: leave.status === "APPROVED" ? CheckCircle2 : 
                     leave.status === "PENDING" || leave.status === "SUBMITTED" ? AlertCircle :
                     leave.status === "REJECTED" || leave.status === "CANCELLED" ? XCircle : AlertCircle,
        statusColor: leave.status === "APPROVED" ? "text-green-600 dark:text-green-400" :
                     leave.status === "PENDING" || leave.status === "SUBMITTED" ? "text-amber-600 dark:text-amber-400" :
                     leave.status === "REJECTED" || leave.status === "CANCELLED" ? "text-red-600 dark:text-red-400" :
                     "text-muted-foreground",
      }));
  }, [leavesData]);

  const showEmployeeContent = user?.role && user.role !== "CEO" && user.role !== "HR_HEAD";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-6 bg-card border border-border shadow-lg backdrop-blur-sm"
        data-control-center
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Control Center</DialogTitle>
          <DialogDescription>User settings and information</DialogDescription>
        </DialogHeader>
        
        {/* User Info Header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/50">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-base shadow-md flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg text-foreground truncate">{user?.name ?? "User"}</h2>
            {user?.department && (
              <p className="text-sm text-muted-foreground truncate">{user.department}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block text-xs text-primary font-medium bg-accent/50 px-2 py-0.5 rounded">
                {formatRole(user?.role ?? "")}
              </span>
              <span className="text-xs text-muted-foreground">Policy v2.0</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        {showEmployeeContent && (
          <div className="flex gap-1 mb-4 p-1 bg-muted/30 rounded-lg">
            <button
              onClick={() => setActiveTab("balance")}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === "balance"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Balances
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === "actions"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Actions
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === "recent"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Recent
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {showEmployeeContent ? (
            <>
              {activeTab === "balance" && (
                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-5 bg-muted rounded animate-pulse" />
                      <div className="h-5 bg-muted rounded animate-pulse" />
                      <div className="h-5 bg-muted rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-sm py-2">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Earned Leave
                        </span>
                        <span className="font-semibold text-foreground">{earned} days</span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-2">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Casual Leave
                        </span>
                        <span className="font-semibold text-foreground">{casual} days</span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-2">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Medical Leave
                        </span>
                        <span className="font-semibold text-foreground">{medical} days</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "actions" && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      router.push("/leaves/apply");
                    }}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <Plane className="h-5 w-5" />
                    <span>Apply Leave</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      router.push("/leaves");
                    }}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    <span>View Requests</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      router.push("/dashboard");
                    }}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <User className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      router.push("/policies");
                    }}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    <span>Policy</span>
                  </Button>
                </div>
              )}

              {activeTab === "recent" && (
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {recentLeaves.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recent leave requests
                    </p>
                  ) : (
                    recentLeaves.map((leave) => {
                      const StatusIcon = leave.statusIcon;
                      return (
                        <div
                          key={leave.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                          onClick={() => {
                            onClose();
                            router.push(`/leaves?highlight=${leave.id}`);
                          }}
                        >
                          <StatusIcon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", leave.statusColor)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground capitalize">
                              {leave.type.toLowerCase()} Leave
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                            </p>
                            <p className="text-xs font-medium mt-1 capitalize" style={{ color: 'inherit' }}>
                              {leave.status.toLowerCase().replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Executive view - organizational metrics available in dashboard
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  router.push("/dashboard");
                }}
              >
                <User className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-6 pt-4 border-t border-border/50 flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
