"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, ArrowLeft, FileX } from "lucide-react";

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED"

type LeaveRow = {
  id: number;
  type: string;
  status: LeaveStatus;
  workingDays?: number;
  endDate?: string;
  fitnessCertificateUrl?: string | null;
};

interface QuickActionsProps {
  leaves: LeaveRow[];
  isLoading: boolean;
}

export function QuickActions({ leaves, isLoading }: QuickActionsProps) {
  const router = useRouter();

  const { hasPending, hasApprovedOwn, hasMedicalOver7Days, pendingId, approvedOwnId, medicalOver7Id } = useMemo(() => {
    const pending = leaves.find(
      (l) => l.status === "PENDING" || l.status === "SUBMITTED"
    );
    // Only show "Request Cancellation" for APPROVED leaves owned by user
    const approvedOwn = leaves.find((l) => l.status === "APPROVED");
    
    // "Return to Duty" only for ML > 7 days that has ended and fitnessCertificateUrl is missing
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const medicalOver7 = leaves.find((l) => {
      if (l.status !== "APPROVED" || l.type !== "MEDICAL" || (l.workingDays ?? 0) <= 7) {
        return false;
      }
      // Check if leave has ended
      if (!l.endDate) return false;
      const endDate = new Date(l.endDate);
      endDate.setHours(0, 0, 0, 0);
      const hasEnded = endDate < today;
      
      // Check if fitness certificate is missing
      const missingFitnessCert = !l.fitnessCertificateUrl;
      
      return hasEnded && missingFitnessCert;
    });

    return {
      hasPending: !!pending,
      hasApprovedOwn: !!approvedOwn,
      hasMedicalOver7Days: !!medicalOver7,
      pendingId: pending?.id,
      approvedOwnId: approvedOwn?.id,
      medicalOver7Id: medicalOver7?.id,
    };
  }, [leaves]);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() => router.push("/leaves/apply")}
        className="animate-fade-in-up"
        size="default"
      >
        <Plus className="mr-2 size-4" />
        Apply Leave
      </Button>

      {hasPending && pendingId && (
        <Button
          onClick={() => router.push(`/leaves?id=${pendingId}`)}
          variant="outline"
          className="animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <X className="mr-2 size-4" />
          Cancel Pending Request
        </Button>
      )}

      {hasMedicalOver7Days && medicalOver7Id && (
        <Button
          onClick={() => router.push(`/leaves?id=${medicalOver7Id}`)}
          variant="outline"
          className="animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <ArrowLeft className="mr-2 size-4" />
          Return to Duty
        </Button>
      )}

      {hasApprovedOwn && approvedOwnId && (
        <Button
          onClick={() => router.push(`/leaves?id=${approvedOwnId}`)}
          variant="outline"
          className="animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <FileX className="mr-2 size-4" />
          Request Cancellation
        </Button>
      )}
    </div>
  );
}
