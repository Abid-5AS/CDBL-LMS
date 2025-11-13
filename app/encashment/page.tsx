"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Info, DollarSign, AlertCircle } from "lucide-react";

interface Balance {
  opening: number;
  accrued: number;
  used: number;
  closing: number;
}

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
}

export default function EncashmentPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [daysRequested, setDaysRequested] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requests, setRequests] = useState<EncashmentRequest[]>([]);

  const currentYear = new Date().getFullYear();
  const maxEncashable = Math.max(0, currentBalance - 10);

  useEffect(() => {
    fetchBalance();
    fetchRequests();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/balances");
      if (!res.ok) throw new Error("Failed to fetch balance");
      const data = await res.json();

      // Find EL balance for current year
      const elBalance = data.balances?.find(
        (b: any) => b.type === "EARNED" && b.year === currentYear
      );

      if (elBalance) {
        setBalance(elBalance);
        const current = (elBalance.opening ?? 0) + (elBalance.accrued ?? 0) - (elBalance.used ?? 0);
        setCurrentBalance(current);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/encashment");
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to fetch encashment requests:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/encashment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysRequested: Number(daysRequested),
          reason: reason || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit encashment request");
      }

      setSuccess(`Successfully submitted encashment request for ${daysRequested} days. Remaining balance: ${data.remainingBalance} days.`);
      setDaysRequested(0);
      setReason("");
      fetchBalance();
      fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const pendingRequest = requests.find(r => r.status === "PENDING");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">EL Encashment</h1>
        <p className="text-gray-600">
          Convert your earned leave balance exceeding 10 days into cash payment
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Policy 6.19.f</AlertTitle>
        <AlertDescription>
          Accrued accumulated earned leave in excess of 10 days can be encashed.
          You must retain at least 10 days of EL balance.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Current EL Balance</CardTitle>
            <CardDescription>Year {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            {balance ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Opening:</span>
                  <span className="font-semibold">{balance.opening} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accrued:</span>
                  <span className="font-semibold">{balance.accrued} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Used:</span>
                  <span className="font-semibold">{balance.used} days</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Current Balance:</span>
                  <span className="font-bold text-lg">{currentBalance} days</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No balance record found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encashable Amount</CardTitle>
            <CardDescription>Maximum you can encash</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p className="text-4xl font-bold text-green-600">{maxEncashable}</p>
              <p className="text-gray-600 mt-2">days available for encashment</p>
              <p className="text-sm text-gray-500 mt-1">
                (Must keep minimum 10 days)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingRequest && (
        <Alert variant="default" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Request</AlertTitle>
          <AlertDescription>
            You have a pending encashment request for {pendingRequest.daysRequested} days
            submitted on {new Date(pendingRequest.createdAt).toLocaleDateString()}.
            Please wait for approval before submitting another request.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request EL Encashment</CardTitle>
          <CardDescription>
            Submit a request to encash your earned leave balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Days to Encash *
              </label>
              <Input
                type="number"
                min="1"
                max={maxEncashable}
                value={daysRequested || ""}
                onChange={(e) => setDaysRequested(Number(e.target.value))}
                placeholder={`Max: ${maxEncashable} days`}
                disabled={loading || maxEncashable <= 0 || !!pendingRequest}
                required
              />
              {daysRequested > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Remaining balance after encashment: {currentBalance - daysRequested} days
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Reason (Optional)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional: Provide a reason for encashment"
                disabled={loading || !!pendingRequest}
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || maxEncashable <= 0 || !!pendingRequest || daysRequested <= 0}
              className="w-full"
            >
              {loading ? "Submitting..." : "Submit Encashment Request"}
            </Button>

            {maxEncashable <= 0 && (
              <p className="text-sm text-red-600 text-center">
                You need more than 10 days EL balance to request encashment.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <div>
                    <p className="font-semibold">{req.daysRequested} days</p>
                    <p className="text-sm text-gray-600">
                      {new Date(req.createdAt).toLocaleDateString()} - Year {req.year}
                    </p>
                    {req.reason && (
                      <p className="text-sm text-gray-500 mt-1">{req.reason}</p>
                    )}
                    {req.rejectionReason && (
                      <p className="text-sm text-red-600 mt-1">
                        Rejection: {req.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        req.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : req.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : req.status === "PAID"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
