"use client";

import {
  AlertCircle,
  Info,
  HelpCircle,
  Calendar,
  MessageSquare,
  Paperclip,
  Send,
  CheckCircle2,
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
    initiateReview,
  } = useApplyLeaveForm();
  const router = useRouter();

  const heroStats = [
    {
      label: "Current Balance",
      value:
        typeof balanceForType === "number" ? `${balanceForType} days` : "—",
    },
    {
      label: "Requested",
      value: requestedDays > 0 ? `${requestedDays} days` : "—",
    },
    {
      label: "Projected Balance",
      value:
        remainingBalance || remainingBalance === 0
          ? `${Math.max(remainingBalance, 0)} days`
          : "—",
      state:
        remainingBalance < 0
          ? "text-destructive"
          : remainingBalance < 2
          ? "text-data-warning"
          : "text-data-success",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Apply for Leave
            </h1>
            <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
              Share your leave details, attach supporting documents, and track
              balances in real time before submitting.
            </p>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            {heroStats.map((stat) => (
              <Card
                key={stat.label}
                className="rounded-2xl border border-border bg-card/90 shadow-sm"
              >
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-semibold text-foreground",
                      stat.state
                    )}
                  >
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Two-column responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Form Section (8 columns) */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-card border border-border shadow-lg shadow-black/5 dark:shadow-black/30 rounded-3xl">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground leading-6">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Leave Details
                  </CardTitle>
                  {lastSavedTime && (
                    <Badge
                      variant="secondary"
                      className="bg-data-success/15 text-data-success border border-data-success/40 dark:bg-data-success/20 dark:text-data-success"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Saved just now
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <form
                onSubmit={handleReviewSubmit}
                noValidate
                aria-label="Leave application form"
              >
                <CardContent className="p-6 space-y-6">
                  {/* Leave Type and Date Range in Grid */}
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
                            When did the disabling incident occur? Must be within 3 months of leave start date.
                          </p>
                          <input
                            type="date"
                            value={incidentDate ? incidentDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setIncidentDate(value ? new Date(value) : undefined);
                              setErrors((prev) => ({ ...prev, incidentDate: undefined }));
                            }}
                            max={dateRange.start ? dateRange.start.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
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
                              <span className="text-blue-700 dark:text-blue-300">Full pay (0-90 days):</span>
                              <span className="font-semibold text-blue-900 dark:text-blue-100">{payCalculation.fullPayDays} days</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-700 dark:text-blue-300">Half pay (91-180 days):</span>
                              <span className="font-semibold text-blue-900 dark:text-blue-100">{payCalculation.halfPayDays} days</span>
                            </div>
                            {payCalculation.unPaidDays > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700 dark:text-blue-300">Unpaid (180+ days):</span>
                                <span className="font-semibold text-destructive">{payCalculation.unPaidDays} days</span>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-blue-900 dark:text-blue-100">Total days:</span>
                              <span className="font-bold text-blue-900 dark:text-blue-100">{payCalculation.totalDays} days</span>
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Per Policy 6.22: First 3 months at full pay, next 3 months at half pay
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

                {/* Actions inside form */}
                <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-muted mt-6 px-6 pb-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                    className="transition-transform hover:scale-[1.02]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    loadingText="Submitting Request..."
                    className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-md rounded-full px-6"
                    leftIcon={<Send className="size-4" aria-hidden="true" />}
                  >
                    Submit Request
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT: Unified Guidance Panel (4 columns) */}
          <aside className="lg:col-span-4 space-y-6">
            <LeaveSummarySidebar
              type={type}
              dateRange={dateRange}
              requestedDays={requestedDays}
              remainingBalance={remainingBalance}
              balancesLoading={balancesLoading}
              balancesError={Boolean(balancesError)}
              warnings={warnings}
              projectedBalancePercent={projectedBalancePercent}
              allBalances={balances ? {
                EARNED: balances.EARNED,
                CASUAL: balances.CASUAL,
                MEDICAL: balances.MEDICAL,
              } : undefined}
            />

            <Card className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  Need a hand?
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Check your policy rules or chat with HR before submitting to
                avoid rework.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/policies")}
                >
                  View Policies
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => router.push("/help")}
                >
                  Contact HR
                </Button>
              </div>
            </Card>
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all hover:scale-[1.02]"
          >
            <Send className="w-4 h-4 mr-2" />
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
