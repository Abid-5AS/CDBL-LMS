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
import { CheckCircle, XCircle, Clock, DollarSign, FileDown } from "lucide-react";
import { toast } from "sonner";

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
  paymentStatus: string | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentAmount: number | null;
  paymentNotes: string | null;
  paymentReceiptUrl: string | null;
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

export function EncashmentRequestsContent() {
  const [requests, setRequests] = useState<EncashmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<EncashmentRequest | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<EncashmentRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/encashment" : `/api/encashment?status=${filter}`;
      const res = await fetch(url);
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

  const openPaymentModal = (request: EncashmentRequest) => {
    setPaymentRequest(request);
    setShowPaymentModal(true);
    setPaymentMethod("BANK_TRANSFER");
    setPaymentReference("");
    setPaymentAmount("");
    setPaymentNotes("");
    setError(null);
  };

  const handleProcessPayment = async () => {
    if (!paymentRequest || !paymentReference || !paymentAmount) {
      setError("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/api/encashment/${paymentRequest.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paymentMethod,
          paymentReference,
          paymentAmount: parseFloat(paymentAmount),
          paymentNotes: paymentNotes || undefined,
          paymentDate: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process payment");
      }

      setShowPaymentModal(false);
      setPaymentRequest(null);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Encashment Requests</h1>
        <p className="text-gray-600">
          Review and approve employee EL encashment requests
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
        <div className="flex gap-2">
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
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              const url = `/api/admin/encashment/export${filter && filter !== "all" ? `?status=${filter}` : ""}`;
              const res = await fetch(url);
              if (!res.ok) throw new Error("Failed to export");
              const blob = await res.blob();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `encashment_export_${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
              toast.success("Encashment data exported!");
            } catch {
              toast.error("Failed to export encashment data");
            }
          }}
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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

                {(request.paymentStatus || request.status === "APPROVED") && (
                  <div className="mb-4 p-4 rounded border-2 border-blue-200 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-blue-900">Payment Information</p>
                      {request.paymentStatus && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            request.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-800"
                              : request.paymentStatus === "PROCESSING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {request.paymentStatus}
                        </span>
                      )}
                    </div>

                    {request.paymentDate ? (
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Payment Date</p>
                          <p className="font-medium">
                            {new Date(request.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Payment Method</p>
                          <p className="font-medium">{request.paymentMethod || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Reference</p>
                          <p className="font-medium">{request.paymentReference || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium text-green-600">
                            {request.paymentAmount
                              ? `৳${request.paymentAmount.toLocaleString()}`
                              : "N/A"}
                          </p>
                        </div>
                        {request.paymentNotes && (
                          <div className="md:col-span-2">
                            <p className="text-gray-600">Notes</p>
                            <p className="font-medium">{request.paymentNotes}</p>
                          </div>
                        )}
                      </div>
                    ) : request.status === "APPROVED" && (
                      <p className="text-sm text-gray-600">
                        Payment pending. Use the "Process Payment" button below to record payment
                        details.
                      </p>
                    )}
                  </div>
                )}

                {request.status === "APPROVED" && request.paymentStatus !== "PAID" && (
                  <div className="mb-4">
                    <Button
                      variant="default"
                      onClick={() => openPaymentModal(request)}
                      className="w-full"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
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

      <Dialog open={showPaymentModal} onOpenChange={() => setShowPaymentModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              {paymentRequest && (
                <>
                  Record payment details for {paymentRequest.user.name}'s encashment
                  of {paymentRequest.daysRequested} days
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="MOBILE_BANKING">Mobile Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Reference *
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., Transaction ID, Cheque Number"
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Amount (৳) *
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g., 50000"
                className="w-full p-2 border border-gray-300 rounded"
                required
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Notes (Optional)
              </label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Additional notes about the payment..."
                rows={3}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={processing || !paymentReference || !paymentAmount}
            >
              {processing ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
