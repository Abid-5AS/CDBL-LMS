"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";

interface EncashmentRequest {
  id: number;
  year: number;
  daysRequested: number;
  balanceAtRequest: number;
  reason: string | null;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    empCode: string | null;
    department: string | null;
  };
  approver?: {
    id: number;
    name: string;
    role: string;
  } | null;
}

export default function EncashmentRequestsPage() {
  const [requests, setRequests] = useState<EncashmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<EncashmentRequest | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/encashment?status=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to fetch encashment requests:", err);
      setError("Failed to load encashment requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedRequest || !decision) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/api/encashment/${selectedRequest.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === "REJECTED" ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to process request");
      }

      // Close dialog and refresh
      setSelectedRequest(null);
      setDecision(null);
      setRejectionReason("");
      fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to process request");
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalDialog = (request: EncashmentRequest, action: "APPROVED" | "REJECTED") => {
    setSelectedRequest(request);
    setDecision(action);
    setError(null);
    setRejectionReason("");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Encashment Requests</h1>
        <p className="text-gray-600">
          Review and approve employee EL encashment requests
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {["PENDING", "APPROVED", "REJECTED", "PAID", "all"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto mb-4 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No {filter.toLowerCase()} encashment requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{request.user.name}</CardTitle>
                    <CardDescription>
                      {request.user.email}
                      {request.user.empCode && ` • ${request.user.empCode}`}
                      {request.user.department && ` • ${request.user.department}`}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      request.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : request.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : request.status === "PAID"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Days Requested</p>
                    <p className="text-2xl font-bold text-green-600">
                      {request.daysRequested} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Balance at Request</p>
                    <p className="text-2xl font-bold">{request.balanceAtRequest} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-semibold">{request.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="font-semibold">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {request.reason && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Reason</p>
                    <p className="text-sm bg-gray-50 p-3 rounded">{request.reason}</p>
                  </div>
                )}

                {request.rejectionReason && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Rejection Reason</p>
                    <p className="text-sm bg-red-50 p-3 rounded text-red-700">
                      {request.rejectionReason}
                    </p>
                  </div>
                )}

                {request.approver && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      {request.status === "APPROVED" ? "Approved" : "Processed"} by{" "}
                      {request.approver.name} ({request.approver.role}) on{" "}
                      {request.approvedAt
                        ? new Date(request.approvedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                )}

                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => openApprovalDialog(request, "APPROVED")}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openApprovalDialog(request, "REJECTED")}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "APPROVED" ? "Approve" : "Reject"} Encashment Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {decision === "APPROVED"
                    ? `Approve ${selectedRequest.daysRequested} days encashment for ${selectedRequest.user.name}?`
                    : `Reject encashment request from ${selectedRequest.user.name}?`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {decision === "REJECTED" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Rejection Reason *
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={4}
                required
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproval}
              disabled={
                processing || (decision === "REJECTED" && !rejectionReason.trim())
              }
              variant={decision === "APPROVED" ? "default" : "destructive"}
            >
              {processing ? "Processing..." : decision === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
