"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitLeaveRequestWithState } from "@/app/actions/submit-leave-actions";
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

export function ApplyLeaveFormWithActionState() {
  const [state, formAction, isPending] = useActionState(submitLeaveRequestWithState, {
    success: false,
    error: null,
    message: null,
    id: null
  });

  const router = useRouter();
  
  const {
    type,
    dateRange,
    reason,
    file,
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
    handleManualSave,
    initiateReview,
  } = useApplyLeaveForm();

  // Handle the result from the server action
  useEffect(() => {
    if (state.success && state.id) {
      toast.success(state.message || "Leave request submitted successfully!");
      router.push(`/leaves/${state.id}`);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

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

  // Create form data for submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create FormData object for the server action
    const formData = new FormData();
    
    formData.append("type", type);
    if (dateRange.start) formData.append("startDate", dateRange.start.toISOString());
    if (dateRange.end) formData.append("endDate", dateRange.end.toISOString());
    formData.append("reason", reason);
    formData.append("needsCertificate", String(requiresCertificate));
    if (incidentDate) formData.append("incidentDate", incidentDate.toISOString());
    
    if (file) {
      formData.append("certificate", file, file.name);
    }
    
    formAction(formData);
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="surface-card p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Leave Request
              </p>
              <h1 className="text-3xl font-semibold text-foreground">
                Apply for Leave
              </h1>
              <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
                Share your leave details, attach supporting documents, and track
                balances in real time before submitting.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-widest">Today</p>
              <p className="text-xl font-semibold text-foreground">
                {todayLabel}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/70 px-4 py-3"
              >
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
              </div>
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
                onSubmit={handleSubmit}
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
                      submitting={isPending}
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
                            disabled={isPending}
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
                    submitting={isPending}
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
                    submitting={isPending}
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
                <div className="flex flex-col gap-4 pt-6 border-t border-muted mt-6 px-6 pb-6">
                  <div
                    className="text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    <p className="font-semibold text-foreground text-sm">
                      Form status
                    </p>
                    <p>
                      {isPending
                        ? "Submitting request…"
                        : lastSavedTime
                        ? `Auto-saved at ${lastSavedTime}`
                        : "Draft auto-saves every minute. You can also save manually."}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isPending}
                      className="transition-transform hover:scale-[1.02]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleManualSave}
                      disabled={isPending}
                      className="transition-transform hover:scale-[1.02]"
                      leftIcon={<Save className="size-4" aria-hidden="true" />}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-md rounded-full px-6"
                      leftIcon={<Send className="size-4" aria-hidden="true" />}
                    >
                      {isPending ? "Submitting Request..." : "Submit Request"}
                    </Button>
                  </div>
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
              // Create form data for submission
              const formData = new FormData();
              
              formData.append("type", type);
              if (dateRange.start) formData.append("startDate", dateRange.start.toISOString());
              if (dateRange.end) formData.append("endDate", dateRange.end.toISOString());
              formData.append("reason", reason);
              formData.append("needsCertificate", String(requiresCertificate));
              if (incidentDate) formData.append("incidentDate", incidentDate.toISOString());
              
              if (file) {
                formData.append("certificate", file, file.name);
              }
              
              formAction(formData);
            }}
            disabled={isPending}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all hover:scale-[1.02]"
            leftIcon={<Send className="size-4" aria-hidden="true" />}
          >
            {isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      )}

      <LeaveConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={() => {
          // Create form data for submission
          const formData = new FormData();
          
          formData.append("type", type);
          if (dateRange.start) formData.append("startDate", dateRange.start.toISOString());
          if (dateRange.end) formData.append("endDate", dateRange.end.toISOString());
          formData.append("reason", reason);
          formData.append("needsCertificate", String(requiresCertificate));
          if (incidentDate) formData.append("incidentDate", incidentDate.toISOString());
          
          if (file) {
            formData.append("certificate", file, file.name);
          }
          
          formAction(formData);
        }}
        submitting={isPending}
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