"use client";

import { useEffect, useState } from "react";
import { Calendar, UserPlus, Trash2, AlertCircle, Info, Clock } from "lucide-react";
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
import { toast } from "sonner";

type Delegation = {
  id: number;
  delegateId: number;
  delegateName: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  department?: string;
  role: string;
};

export function DelegationManagement() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [delegatedToMe, setDelegatedToMe] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDelegations();
  }, []);

  const fetchDelegations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/approvals/delegate");
      if (response.ok) {
        const data = await response.json();
        setDelegations(data.myDelegations || []);
        setDelegatedToMe(data.delegatedToMe || []);
      }
    } catch (error) {
      console.error("Error fetching delegations:", error);
      toast.error("Failed to load delegations");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    fetchUsers();
  };

  const handleCreateDelegation = async () => {
    if (!selectedUserId || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/approvals/delegate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delegateId: selectedUserId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Delegation created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchDelegations();
      } else {
        toast.error(data.error || "Failed to create delegation");
      }
    } catch (error) {
      console.error("Error creating delegation:", error);
      toast.error("Failed to create delegation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeDelegation = async (delegationId: number) => {
    if (!confirm("Are you sure you want to revoke this delegation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/approvals/delegate?id=${delegationId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Delegation revoked successfully");
        fetchDelegations();
      } else {
        toast.error(data.error || "Failed to revoke delegation");
      }
    } catch (error) {
      console.error("Error revoking delegation:", error);
      toast.error("Failed to revoke delegation");
    }
  };

  const resetForm = () => {
    setSelectedUserId(null);
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Delegation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Approval Delegation</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Learn about approval delegation"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">
                    Delegate your approval authority to another user when you're
                    unavailable. They can approve requests on your behalf during
                    the specified period.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              New Delegation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* My Delegations */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              My Delegations ({delegations.length})
            </h3>
            {delegations.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active delegations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {delegations.map((delegation) => (
                  <div
                    key={delegation.id}
                    className="flex items-center justify-between p-3 rounded border border-border bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {delegation.delegateName}
                        </p>
                        <Badge
                          variant={delegation.isActive ? "default" : "secondary"}
                        >
                          {delegation.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(delegation.startDate)} -{" "}
                        {formatDate(delegation.endDate)}
                      </p>
                      {delegation.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {delegation.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeDelegation(delegation.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delegated to Me */}
          {delegatedToMe.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Delegated to Me ({delegatedToMe.length})
              </h3>
              <div className="space-y-2">
                {delegatedToMe.map((delegation) => (
                  <div
                    key={delegation.id}
                    className="p-3 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">
                        From: {delegation.delegateName}
                      </p>
                      <Badge
                        variant={delegation.isActive ? "default" : "secondary"}
                      >
                        {delegation.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(delegation.startDate)} -{" "}
                      {formatDate(delegation.endDate)}
                    </p>
                    {delegation.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {delegation.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Delegation Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Delegation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Delegate To <span className="text-destructive">*</span>
              </label>
              {loadingUsers ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <select
                  value={selectedUserId || ""}
                  onChange={(e) =>
                    setSelectedUserId(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full p-2 border border-border rounded bg-background"
                  required
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role}
                      {user.department ? ` - ${user.department}` : ""})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Start Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-2 border border-border rounded bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  End Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                  className="w-full p-2 border border-border rounded bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Annual leave, business trip..."
                className="w-full p-2 border border-border rounded bg-background min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="p-3 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  The selected user will be able to approve leave requests on your
                  behalf during the specified period. You can revoke the
                  delegation at any time.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDelegation}
              disabled={submitting || !selectedUserId || !startDate || !endDate}
            >
              {submitting ? "Creating..." : "Create Delegation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
