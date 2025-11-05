"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, RotateCcw, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";
import { getStatusColors } from "@/lib/status-colors";
import { useFilterFromUrl } from "@/lib/url-filters";

type SummaryCardProps = {
  label: string;
  count: number;
  icon: typeof Clock;
  status: "PENDING" | "FORWARDED" | "APPROVED" | "RETURNED" | "CANCELLED";
  onClick?: () => void;
};

function SummaryCard({ label, count, icon: Icon, status, onClick }: SummaryCardProps) {
  const colorClasses = getStatusColors(status, "card");

  return (
    <Card
      className={cn(
        "cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md shadow-sm",
        "overflow-hidden word-break-keep-all",
        "w-full",
        colorClasses,
        onClick && "hover:border-opacity-80"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
        <div className={cn("p-2 rounded-lg mb-2", colorClasses)}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <p className="text-xs font-medium sm:text-sm opacity-80 mb-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-bold whitespace-nowrap">
          {count}
        </p>
      </CardContent>
    </Card>
  );
}

type DeptHeadSummaryCardsProps = {
  pending: number;
  approved: number;
  returned: number;
  cancelled: number;
};

export function DeptHeadSummaryCards({
  pending,
  approved,
  returned,
  cancelled,
}: DeptHeadSummaryCardsProps) {
  const user = useUser();
  const userRole = user?.role || "DEPT_HEAD";
  const isDeptHead = userRole === "DEPT_HEAD";
  const { set } = useFilterFromUrl();

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Pending"
        count={pending}
        icon={Clock}
        status="PENDING"
        onClick={() => {
          set({ status: "PENDING" });
          setTimeout(() => {
            const tableElement = document.getElementById("pending-requests-table");
            if (tableElement) {
              tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 100);
        }}
      />
      <SummaryCard
        label={isDeptHead ? "Forwarded" : "Approved"}
        count={approved}
        icon={isDeptHead ? ArrowRight : CheckCircle2}
        status={isDeptHead ? "FORWARDED" : "APPROVED"}
        onClick={() => {
          set({ status: isDeptHead ? "FORWARDED" : "APPROVED" });
          setTimeout(() => {
            const tableElement = document.getElementById("pending-requests-table");
            if (tableElement) {
              tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 100);
        }}
      />
      <SummaryCard
        label="Returned"
        count={returned}
        icon={RotateCcw}
        status="RETURNED"
        onClick={() => {
          set({ status: "RETURNED" });
          setTimeout(() => {
            const tableElement = document.getElementById("pending-requests-table");
            if (tableElement) {
              tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 100);
        }}
      />
      <SummaryCard
        label="Cancelled"
        count={cancelled}
        icon={XCircle}
        status="CANCELLED"
        onClick={() => {
          set({ status: "CANCELLED" });
          setTimeout(() => {
            const tableElement = document.getElementById("pending-requests-table");
            if (tableElement) {
              tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 100);
        }}
      />
    </div>
  );
}

