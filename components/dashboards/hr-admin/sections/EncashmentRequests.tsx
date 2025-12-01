"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  approveEncashmentRequest,
  rejectEncashmentRequest,
} from "@/app/actions/encashment-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EncashmentRequest {
  id: number;
  userId: number;
  daysRequested: number;
  balanceAtRequest: number;
  reason: string | null;
  createdAt: Date;
  user: {
    name: string;
    empCode: string | null;
    department: string | null;
  };
}

interface EncashmentRequestsProps {
  requests: EncashmentRequest[];
}

export function EncashmentRequests({
  requests: initialRequests,
}: EncashmentRequestsProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    requestId: number | null;
  }>({ isOpen: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      const result = await approveEncashmentRequest(id);
      if (result.success) {
        toast.success("Encashment request approved");
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error(result.error || "Failed to approve request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (id: number) => {
    setRejectDialog({ isOpen: true, requestId: id });
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectDialog.requestId) return;
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setProcessingId(rejectDialog.requestId);
    try {
      const result = await rejectEncashmentRequest(
        rejectDialog.requestId,
        rejectionReason
      );
      if (result.success) {
        toast.success("Encashment request rejected");
        setRequests((prev) =>
          prev.filter((r) => r.id !== rejectDialog.requestId)
        );
        setRejectDialog({ isOpen: false, requestId: null });
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return null; // Don't show section if no requests
  }

  return (
    <Card className="border-slate-200 shadow-sm rounded-md mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Encashment Requests
          <Badge variant="secondary" className="ml-2">
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Balance (At Request)</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="font-medium">{request.user.name}</div>
                  <div className="text-xs text-slate-500">
                    {request.user.empCode} • {request.user.department}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {request.daysRequested} Days
                </TableCell>
                <TableCell>{request.balanceAtRequest} Days</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {request.reason || "-"}
                </TableCell>
                <TableCell>
                  {format(new Date(request.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => handleRejectClick(request.id)}
                      disabled={processingId === request.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog
          open={rejectDialog.isOpen}
          onOpenChange={(open) =>
            setRejectDialog((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Encashment Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this request.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setRejectDialog({ isOpen: false, requestId: null })
                }
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={processingId !== null}
              >
                {processingId !== null ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
