import { getCurrentUser } from "@/lib/auth";
import { apiGet } from "@/lib/apiClient";
import { redirect } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/layout/ModalShell";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Plane, Clock, LogOut, FileText, User, Calendar, CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

type TabValue = "balance" | "actions" | "recent";

type StatusMeta = {
  icon: LucideIcon;
  intent: "success" | "warning" | "danger" | "info" | "neutral";
  label: string;
};

const STATUS_META: Record<string, StatusMeta> = {
  APPROVED: { icon: CheckCircle2, intent: "success", label: "Approved" },
  PENDING: { icon: AlertCircle, intent: "warning", label: "Pending" },
  SUBMITTED: { icon: AlertCircle, intent: "warning", label: "Submitted" },
  REJECTED: { icon: XCircle, intent: "danger", label: "Rejected" },
  CANCELLED: { icon: XCircle, intent: "danger", label: "Cancelled" },
};

const getStatusMeta = (status: string): StatusMeta => {
  const normalized = status?.toUpperCase?.() ?? "";
  if (STATUS_META[normalized]) return STATUS_META[normalized];
  return {
    icon: Info,
    intent: "info",
    label: normalized.replaceAll("_", " ").toLowerCase(),
  };
};

// Server Component: Renders static content and pre-fetched data
export async function ControlCenterServer({ onClose }: { onClose: () => void }) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Fetch balances on the server (only for non-executive roles)
  let balances = {};
  if (user.role !== "CEO" && user.role !== "HR_HEAD") {
    try {
      balances = await apiGet<BalanceData>("/api/balance/mine");
    } catch (error) {
      console.error("Failed to fetch ControlCenter data:", error);
      // Handle error gracefully, perhaps with default values
      balances = { earned: 0, casual: 0, medical: 0 };
    }
  }

  // Normalize balance data (handle both uppercase and lowercase keys)
  const earned = balances.earned ?? balances.EARNED ?? 0;
  const casual = balances.casual ?? balances.CASUAL ?? 0;
  const medical = balances.medical ?? balances.MEDICAL ?? 0;

  const showEmployeeContent = user.role !== "CEO" && user.role !== "HR_HEAD";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md w-[calc(100vw-2rem)] border-none bg-transparent p-0 shadow-none"
        data-control-center
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Control Center</DialogTitle>
          <DialogDescription>User settings and information</DialogDescription>
        </DialogHeader>

        <ModalShell
          size="sm"
          className="w-full"
          title="Control Center"
          description="Your leave balances, quick actions, and recent activity."
        >
          {/* User Info Header - Rendered on server */}
          <div className="flex items-center gap-4 pb-4 border-b border-border/60">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-base shadow-md flex-shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="heading-sm truncate">{user.name ?? "User"}</h2>
              {user.department && (
                <p className="body-muted truncate">{user.department}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip intent="info" variant="soft" label={formatRole(user.role ?? "")} />
                <StatusChip intent="muted" variant="outline" label="Policy v2.0" />
              </div>
            </div>
          </div>

          {/* Employee Content - Rendered on server if applicable */}
          {showEmployeeContent ? (
            <ControlCenterClientWithBalances 
              onClose={onClose} 
              balances={{ earned, casual, medical }} 
              user={user}
            />
          ) : (
            <div className="text-center py-6 space-y-4">
              <p className="body-muted">
                Executive view — organizational metrics available in dashboard
              </p>
              <a href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={onClose}
                >
                  <User className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </a>
            </div>
          )}

          {/* Logout Button - Client component for interactivity */}
          <div className="pt-4 border-t border-border/60 flex justify-end">
            <ClientLogoutButton onClose={onClose} />
          </div>
        </ModalShell>
      </DialogContent>
    </Dialog>
  );
}

// Client Component: Handles interactive elements that need client-side functionality
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLeaveData } from "@/components/providers";

function ControlCenterClientWithBalances({ 
  onClose, 
  balances, 
  user 
}: { 
  onClose: () => void; 
  balances: { earned: number; casual: number; medical: number }; 
  user: any;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("balance");

  // This needs to remain client-side since it uses context
  const { data: leavesData } = useLeaveData();

  // Process recent leaves
  const recentLeaves = useMemo(() => {
    if (!leavesData?.items) return [];
    return leavesData.items
      .slice(0, 5)
      .map((leave: any) => ({
        ...leave,
        statusMeta: getStatusMeta(leave.status),
      }));
  }, [leavesData]);

  const showEmployeeContent = user?.role && user.role !== "CEO" && user.role !== "HR_HEAD";

  return (
    <>
      {/* Tabs Navigation - Client for interactivity */}
      {showEmployeeContent && (
        <div className="flex gap-1 mb-4 p-1 bg-surface-2 border border-outline/60 dark:border-border/60 rounded-xl">
          <button
            onClick={() => setActiveTab("balance")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "balance"
                ? "bg-surface-1 text-foreground shadow-sm border border-outline/60 dark:border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "actions"
                ? "bg-surface-1 text-foreground shadow-sm border border-outline/60 dark:border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "recent"
                ? "bg-surface-1 text-foreground shadow-sm border border-outline/60 dark:border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Recent
          </button>
        </div>
      )}

      {/* Tab Content - Client for dynamic content */}
      <div className="min-h-[200px]">
        {activeTab === "balance" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Earned Leave
              </span>
              <span className="font-semibold text-foreground">{balances.earned} days</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Casual Leave
              </span>
              <span className="font-semibold text-foreground">{balances.casual} days</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Medical Leave
              </span>
              <span className="font-semibold text-foreground">{balances.medical} days</span>
            </div>
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
              <EmptyState
                title="No recent leave requests"
                description="When you apply for leave, it will appear here with status updates."
                icon={Calendar}
                className="border-none bg-transparent shadow-none py-6"
              />
            ) : (
              recentLeaves.map((leave: any) => {
                const meta = leave.statusMeta;
                const MetaIcon = meta.icon;
                return (
                  <button
                    type="button"
                    key={leave.id}
                    className="flex w-full items-start gap-3 rounded-xl border border-outline/50 bg-surface-1 p-3 text-left text-sm transition-colors hover:bg-surface-2 dark:border-border/70"
                    onClick={() => {
                      onClose();
                      router.push(`/leaves?highlight=${leave.id}`);
                    }}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground border border-outline/50 dark:border-border/60">
                      <MetaIcon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium text-foreground capitalize">
                        {leave.type.toLowerCase()} leave
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </p>
                      <StatusChip
                        intent={meta.intent}
                        variant="soft"
                        icon={MetaIcon}
                        label={meta.label}
                        className="w-fit"
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Client component for logout functionality
"use client";
function ClientLogoutButton({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  
  const handleLogout = async () => {
    onClose();
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    window.location.assign("/login");
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleLogout}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
