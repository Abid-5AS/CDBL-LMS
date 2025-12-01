"use client";

import { useState, useEffect } from "react";
import { Search, DollarSign, Plus, Minus, Info, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { LeaveType } from "@prisma/client";
import { toast } from "sonner";

type User = {
  id: number;
  name: string;
  email: string;
  empCode?: string;
  department?: string;
};

type Balance = {
  type: LeaveType;
  opening: number;
  accrued: number;
  used: number;
  closing: number;
  year: number;
};

export function BalanceAdjustment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Adjustment form state
  const [adjustmentType, setAdjustmentType] = useState<LeaveType>(LeaveType.EARNED);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentYear, setAdjustmentYear] = useState<number>(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const response = await fetch(`/api/employees?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.employees || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserBalances = async (userId: number) => {
    setLoadingBalances(true);
    try {
      const response = await fetch(`/api/employees/${userId}/balance`);
      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances || []);
      }
    } catch (error) {
      console.error("Error loading balances:", error);
      toast.error("Failed to load balances");
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    loadUserBalances(user.id);
    setSearchQuery("");
    setUsers([]);
  };

  const handleOpenAdjustModal = () => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }
    setShowAdjustModal(true);
    setAdjustmentAmount(0);
    setAdjustmentReason("");
    setAdjustmentYear(new Date().getFullYear());
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedUser || adjustmentAmount === 0 || !adjustmentReason) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/balance/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          leaveType: adjustmentType,
          year: adjustmentYear,
          amount: adjustmentAmount,
          reason: adjustmentReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Balance adjusted successfully");
        setShowAdjustModal(false);
        loadUserBalances(selectedUser.id);
      } else {
        toast.error(data.error || "Failed to adjust balance");
      }
    } catch (error) {
      console.error("Error adjusting balance:", error);
      toast.error("Failed to adjust balance");
    } finally {
      setSubmitting(false);
    }
  };

  const leaveTypeLabels: Record<LeaveType, string> = {
    EARNED: "Earned",
    CASUAL: "Casual",
    MEDICAL: "Medical",
    MATERNITY: "Maternity",
    PATERNITY: "Paternity",
    STUDY: "Study",
    SPECIAL: "Special",
    SPECIAL_DISABILITY: "Special Disability",
    QUARANTINE: "Quarantine",
    EXTRAWITHPAY: "Extra With Pay",
    EXTRAWITHOUTPAY: "Extra Without Pay",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Manual Balance Adjustment</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Learn about balance adjustments"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">
                    Manually adjust employee leave balances for corrections,
                    carry-forwards, or special circumstances. All adjustments are
                    logged for audit purposes.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Search */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search by name, email, or employee code..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded bg-background"
              />
            </div>

            {/* Search Results */}
            {loadingUsers && (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {users.length > 0 && (
              <div className="border border-border rounded divide-y max-h-60 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                      {user.empCode && ` • ${user.empCode}`}
                      {user.department && ` • ${user.department}`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                <div>
                  <p className="font-medium">Selected Employee</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleOpenAdjustModal}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Adjust Balance
                </Button>
              </div>

              {/* Current Balances */}
              {loadingBalances ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : balances.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Current Balances</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {balances.map((balance, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded border border-border bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            {leaveTypeLabels[balance.type]}
                          </p>
                          <Badge variant="secondary">{balance.year}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Opening</p>
                            <p className="font-medium">{balance.opening}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Accrued</p>
                            <p className="font-medium text-green-600">
                              +{balance.accrued}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Used</p>
                            <p className="font-medium text-orange-600">
                              -{balance.used}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Closing</p>
                            <p className="font-semibold">{balance.closing}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No balances found for this user</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Modal */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Leave Type <span className="text-destructive">*</span>
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as LeaveType)}
                className="w-full p-2 border border-border rounded bg-background"
              >
                {Object.entries(leaveTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Year <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={adjustmentYear}
                  onChange={(e) => setAdjustmentYear(parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                  className="w-full p-2 border border-border rounded bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Amount <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value))}
                  step={0.5}
                  placeholder="e.g., 5 or -2.5"
                  className="w-full p-2 border border-border rounded bg-background"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Plus className="h-3 w-3 text-green-600" />
              <span>Positive values add to balance</span>
              <Minus className="h-3 w-3 text-red-600 ml-2" />
              <span>Negative values subtract</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g., Carry forward from previous year, manual correction..."
                className="w-full p-2 border border-border rounded bg-background min-h-[100px]"
                rows={4}
                required
              />
            </div>

            <div className="p-3 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  This adjustment will be permanently recorded in the audit log.
                  Ensure the amount and reason are correct before proceeding.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdjustModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdjustment}
              disabled={submitting || adjustmentAmount === 0 || !adjustmentReason}
            >
              {submitting ? "Processing..." : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
