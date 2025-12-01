import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveType } from "@prisma/client";
import {
  EncashmentService,
  ENCASHMENT_POLICY,
} from "@/lib/services/encashment.service";
import { EncashmentRequestForm } from "./_components/EncashmentRequestForm";
import { EncashmentHistory } from "./_components/EncashmentHistory";
import { DashboardLoadingFallback } from "../dashboard/shared/LoadingFallback";

async function EncashmentContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();

  // Fetch EL Balance and History in parallel
  const [balance, requests] = await Promise.all([
    prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: user.id,
          type: LeaveType.EARNED,
          year: currentYear,
        },
      },
    }),
    EncashmentService.getUserRequests(user.id),
  ]);

  const currentBalance = balance?.closing || 0;
  const maxEncashableDays = Math.max(
    0,
    currentBalance - ENCASHMENT_POLICY.MIN_BALANCE_TO_KEEP
  );

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Earned Leave Encashment
        </h1>
        <p className="text-slate-500 mt-2">
          Request to encash your accumulated Earned Leave balance.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <EncashmentRequestForm maxEncashableDays={maxEncashableDays} />
          <EncashmentHistory requests={requests} />
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">
              Balance Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Current EL Balance</span>
                <span className="font-medium">{currentBalance} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  Min Required to Keep
                </span>
                <span className="font-medium">
                  {ENCASHMENT_POLICY.MIN_BALANCE_TO_KEEP} Days
                </span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-semibold text-slate-900">
                  Available to Encash
                </span>
                <span className="text-xl font-bold text-emerald-600">
                  {maxEncashableDays} Days
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">Policy Note</h3>
            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
              <li>
                You must retain at least {ENCASHMENT_POLICY.MIN_BALANCE_TO_KEEP}{" "}
                days of Earned Leave.
              </li>
              <li>
                Maximum {ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST} days can
                be encashed per request.
              </li>
              <li>
                Encashment is subject to approval by HR and Management.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EncashmentPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <EncashmentContent />
    </Suspense>
  );
}
