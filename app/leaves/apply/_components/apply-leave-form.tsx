"use client";

import {
  AlertCircle,
  Info,
  Calendar,
  MessageSquare,
  Paperclip,
  Send,
  CheckCircle2,
  Save,
} from "lucide-react";

// UI Components (barrel export)
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Separator,
} from "@/components/ui";
import { LeaveTypeField } from "./form-fields/LeaveTypeField";
import { DateRangeField } from "./form-fields/DateRangeField";
import { ReasonField } from "./form-fields/ReasonField";
import { FileUploadField } from "./form-fields/FileUploadField";
import type { Holiday } from "@/lib/date-utils";

// Lib utilities
import { cn } from "@/lib";
import { fmtDDMMYYYY } from "@/lib/date-utils";

// Local components
import { LeaveConfirmationModal } from "./leave-confirmation-modal";
import { DateRangePicker, FileUploadSection } from "@/components/shared";
import {
  LEAVE_OPTIONS,
  POLICY_TOOLTIPS,
  type LeaveType,
} from "./leave-constants";
import { LeaveSummarySidebar } from "./leave-summary-sidebar";
import { useApplyLeaveForm } from "./use-apply-leave-form";
import { useRouter } from "next/navigation";
import { ConflictWarningCard } from "@/components/leaves/ConflictWarningCard";

export function ApplyLeaveForm() {
  const {
    type,
    dateRange,
    reason,
    file,
    submitting,
    showConfirmModal,
    showOptionalUpload,
    showStickyButton,
    errors,
    balances,
    balancesError,
    balancesLoading,
    requestedDays,
    requiresCertificate,
    minSelectableDate,
    rangeValidation,
    warnings,
    balanceForType,
    remainingBalance,
    lastSavedTime,
    projectedBalancePercent,
    holidays,
    incidentDate,
    payCalculation,
    conflictData,
    checkingConflicts,
    setDateRange,
    setReason,
    setFile,
    setShowOptionalUpload,
    setShowConfirmModal,
    setIncidentDate,
    setErrors,
    handleFileError,
    handleTypeChange,
    clearErrors,
    handleReviewSubmit,
    handleConfirmSubmit,
    handleManualSave,
    initiateReview,
  } = useApplyLeaveForm();
  const router = useRouter();

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const policyHint =
    (type && POLICY_TOOLTIPS[type as LeaveType]) ||
    POLICY_TOOLTIPS.EARNED ||
    null;

  const balancePercent = balanceForType && requestedDays > 0
    ? Math.max(0, Math.min(100, (remainingBalance / balanceForType) * 100))
    : 100;

  const getBalanceColor = (percent: number) => {
    if (percent > 50) return "bg-emerald-500";
    if (percent > 25) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getBalanceTextColor = (balance: number) => {
    if (balance < 0) return "text-rose-600 dark:text-rose-400";
    if (balance < 2) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-500";
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Apply for Leave
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Submit your leave request for approval.
          </p>
        </div>
        {lastSavedTime && (
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-emerald-50/50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Draft saved {lastSavedTime}
          </Badge>
        )}
      </div>

      {/* Warning Banner - modernized */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200/50 bg-amber-50/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-full shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-sm font-semibold text-amber-900">Attention Required</p>
              <ul className="space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Area */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[24px] border-none shadow-xl bg-white/80 dark:bg-card/90 backdrop-blur-xl overflow-hidden">

            <form
              onSubmit={handleReviewSubmit}
              noValidate
              className="flex flex-col min-h-[600px]"
            >
              <div className="p-8 space-y-10 flex-1">
                {/* Section 1: Leave Details */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shadow-sm">1</div>
                    <h3 className="text-xl font-semibold text-foreground">Leave Details</h3>
                  </div>

                  <div className="pl-0 md:pl-12 space-y-6 max-w-xl">
                    <div className="space-y-1">
                      <LeaveTypeField
                        type={type}
                        onTypeChange={handleTypeChange}
                        error={errors.type}
                        clearErrors={clearErrors}
                      />
                    </div>

                    <DateRangeField
                      dateRange={dateRange}
                      setDateRange={(range) =>
                        setDateRange({
                          start: range.start ?? undefined,
                          end: range.end ?? undefined,
                        })
                      }
                      holidays={holidays.map((h) => new Date(h.date))}
                      minSelectableDate={minSelectableDate}
                      submitting={submitting}
                      requestedDays={requestedDays}
                      rangeValidation={rangeValidation}
                      errors={{ start: errors.start, end: errors.end }}
                    />
                  </div>
                </section>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Section 2: Reason */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 font-bold shadow-sm">2</div>
                    <h3 className="text-xl font-semibold text-foreground">Reason & Support</h3>
                  </div>

                  <div className="pl-0 md:pl-12 space-y-6">
                    <ReasonField
                      reason={reason}
                      setReason={setReason}
                      error={errors.reason}
                      submitting={submitting}
                      minLength={10}
                      clearReasonError={clearErrors}
                    />

                    <FileUploadField
                      file={file}
                      setFile={setFile}
                      error={errors.file}
                      required={requiresCertificate}
                      submitting={submitting}
                      showOptionalUpload={showOptionalUpload}
                      setShowOptionalUpload={setShowOptionalUpload}
                      requiresCertificate={requiresCertificate}
                      handleFileError={handleFileError}
                    />
                  </div>
                </section>

                {/* Logic for Special Disability Leave fields if type matches... (simplified for brevity, included below) */}
                {type === "SPECIAL_DISABILITY" && (
                  <div className="pl-0 md:pl-14 pt-4">
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Date of Disabling Incident
                      </label>
                      <input
                        type="date"
                        value={incidentDate ? incidentDate.toISOString().split("T")[0] : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setIncidentDate(value ? new Date(value) : undefined);
                          setErrors((prev) => ({ ...prev, incidentDate: undefined }));
                        }}
                        className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Footer Actions */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting} className="text-muted-foreground hover:text-foreground">
                  Cancel
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={handleManualSave} disabled={submitting} className="bg-white shadow-sm border-slate-200">
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 rounded-xl px-8"
                  >
                    Submit Request
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <LeaveSummarySidebar
            type={type}
            dateRange={dateRange}
            requestedDays={requestedDays}
            remainingBalance={remainingBalance}
            balancesLoading={balancesLoading}
            balancesError={Boolean(balancesError)}
            warnings={warnings}
            projectedBalancePercent={projectedBalancePercent}
            policyHint={policyHint}
            allBalances={balances ? { EARNED: balances.EARNED, CASUAL: balances.CASUAL, MEDICAL: balances.MEDICAL } : undefined}
          />
        </div>
      </div>

      {/* Mobile Sticky Button */}
      {showStickyButton && (
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button
            onClick={(e) => { e.preventDefault(); initiateReview(); }}
            disabled={submitting}
            size="lg"
            className="shadow-xl rounded-full h-14 w-14 p-0 flex items-center justify-center bg-indigo-600 text-white"
          >
            <Send className="size-6 ml-0.5" />
          </Button>
        </div>
      )}

      <LeaveConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSubmit}
        submitting={submitting}
        type={type}
        startDate={dateRange.start!}
        endDate={dateRange.end!}
        duration={requestedDays}
        reason={reason}
        fileName={file?.name || null}
        currentBalance={balanceForType}
        projectedBalance={remainingBalance}
        warnings={warnings}
      />
    </div>
  );
}
