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
    <div className="space-y-4">
      <div className="mx-auto max-w-[1400px] space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="h-6 w-1 bg-primary rounded-full" />
            Apply for Leave
          </h1>
          {lastSavedTime && (
            <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Saved {lastSavedTime}
            </Badge>
          )}
        </div>
        {/* Warning Banner */}
        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Please review</p>
                {warnings.map((warning, idx) => (
                  <p key={idx} className="text-xs text-amber-700 dark:text-amber-300">• {warning}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Two-column responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* LEFT: Form Section (8 columns) */}
          <div className="lg:col-span-8">
            <Card className="border shadow-sm">
              <form
                onSubmit={handleReviewSubmit}
                noValidate
                aria-label="Leave application form"
              >
                <CardContent className="p-4 sm:p-6 space-y-5">
                  {/* Balance Overview - Compact, Inside Form */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Current</p>
                      <p className="text-xl font-bold text-foreground flex items-baseline gap-1">
                        {typeof balanceForType === "number" ? balanceForType : "—"}
                        <span className="text-xs font-normal text-muted-foreground">days</span>
                      </p>
                      {type && balanceForType !== undefined && (
                        <div className="w-full bg-muted/30 rounded-full h-1 mt-2">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                        </div>
                      )}
                    </div>
                    <div className={cn("rounded-lg border p-3", requestedDays > 0 ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-card")}>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Requesting</p>
                      <p className={cn("text-xl font-bold flex items-baseline gap-1", requestedDays > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                        {requestedDays > 0 ? requestedDays : "—"}
                        <span className="text-xs font-normal text-muted-foreground">days</span>
                      </p>
                    </div>
                    <div className={cn("rounded-lg border p-3", remainingBalance !== null && remainingBalance < 0 ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800" : remainingBalance !== null && remainingBalance < 2 ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800")}>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">After</p>
                      <p className={cn("text-xl font-bold flex items-baseline gap-1", remainingBalance !== null ? getBalanceTextColor(remainingBalance) : "text-foreground")}>
                        {remainingBalance !== null ? Math.max(remainingBalance, 0) : "—"}
                        <span className="text-xs font-normal text-muted-foreground">days</span>
                      </p>
                      {remainingBalance !== null && balanceForType !== undefined && (
                        <div className="w-full bg-muted/30 rounded-full h-1 mt-2">
                          <div className={cn("h-full rounded-full transition-all", getBalanceColor(balancePercent))} style={{ width: `${Math.max(0, balancePercent)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Leave Type and Date Range */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <LeaveTypeField
                        type={type}
                        onTypeChange={handleTypeChange}
                        error={errors.type}
                        clearErrors={clearErrors}
                      />
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
                  </div>

                  {/* Special Disability Leave: Incident Date Field */}
                  {type === "SPECIAL_DISABILITY" && (
                    <>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            Date of Disabling Incident
                            <span className="text-destructive">*</span>
                          </label>
                          <p className="text-xs text-muted-foreground">
                            When did the disabling incident occur? Must be
                            within 3 months of leave start date.
                          </p>
                          <input
                            type="date"
                            value={
                              incidentDate
                                ? incidentDate.toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              setIncidentDate(
                                value ? new Date(value) : undefined
                              );
                              setErrors((prev) => ({
                                ...prev,
                                incidentDate: undefined,
                              }));
                            }}
                            max={
                              dateRange.start
                                ? dateRange.start.toISOString().split("T")[0]
                                : new Date().toISOString().split("T")[0]
                            }
                            disabled={submitting}
                            className={cn(
                              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                              errors.incidentDate && "border-destructive"
                            )}
                          />
                          {errors.incidentDate && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.incidentDate}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pay Calculation Preview */}
                      {payCalculation && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Pay Calculation Preview
                            </p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-blue-700 dark:text-blue-300">
                                Full pay (0-90 days):
                              </span>
                              <span className="font-semibold text-blue-900 dark:text-blue-100">
                                {payCalculation.fullPayDays} days
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-700 dark:text-blue-300">
                                Half pay (91-180 days):
                              </span>
                              <span className="font-semibold text-blue-900 dark:text-blue-100">
                                {payCalculation.halfPayDays} days
                              </span>
                            </div>
                            {payCalculation.unPaidDays > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700 dark:text-blue-300">
                                  Unpaid (180+ days):
                                </span>
                                <span className="font-semibold text-destructive">
                                  {payCalculation.unPaidDays} days
                                </span>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                Total days:
                              </span>
                              <span className="font-bold text-blue-900 dark:text-blue-100">
                                {payCalculation.totalDays} days
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Per Policy 6.22: First 3 months at full pay, next 3
                            months at half pay
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Separator */}
                  <Separator className="my-4" />

                  {/* Reason Textarea */}
                  <ReasonField
                    reason={reason}
                    setReason={setReason}
                    error={errors.reason}
                    submitting={submitting}
                    minLength={10}
                    clearReasonError={clearErrors}
                  />

                  {/* Separator */}
                  <Separator className="my-4" />

                  {/* File Upload */}
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

                  {/* General errors */}
                  {errors.general && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 dark:bg-destructive/20 p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                          Validation Error
                        </p>
                        <p className="text-sm text-destructive/90 dark:text-destructive/80 mt-0.5">
                          {errors.general}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t bg-muted/20 px-4 sm:px-6 pb-4">
                  <p className="text-xs text-muted-foreground">
                    {submitting ? "Submitting..." : lastSavedTime ? `Saved ${lastSavedTime}` : "Auto-saves"}
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting} size="sm">Cancel</Button>
                    <Button type="button" variant="outline" onClick={handleManualSave} disabled={submitting} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Save</Button>
                    <Button type="submit" loading={submitting} className="gap-1.5" size="sm"><Send className="h-3.5 w-3.5" />Submit</Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT: Sidebar (4 columns) */}
          <aside className="lg:col-span-4 space-y-0">
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
              allBalances={
                balances
                  ? {
                      EARNED: balances.EARNED,
                      CASUAL: balances.CASUAL,
                      MEDICAL: balances.MEDICAL,
                    }
                  : undefined
              }
            />
          </aside>
        </div>
      </div>

      {/* Sticky Submit Button (visible on scroll for mobile) */}
      {showStickyButton && (
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button
            onClick={(e) => {
              e.preventDefault();
              initiateReview();
            }}
            disabled={submitting}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all gap-2"
          >
            <Send className="size-4" aria-hidden="true" />
            {submitting ? "Submitting..." : "Submit Request"}
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
