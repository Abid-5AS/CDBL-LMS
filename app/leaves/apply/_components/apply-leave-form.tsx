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
import { FileUploadSection } from "./file-upload-section";
import { DateRangePicker } from "./date-range-picker";
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
    setDateRange,
    setReason,
    setFile,
    setShowOptionalUpload,
    setShowConfirmModal,
    handleFileError,
    handleTypeChange,
    clearErrors,
    handleReviewSubmit,
    handleConfirmSubmit,
    initiateReview,
  } = useApplyLeaveForm();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-text-primary">
            Apply for Leave
          </h1>
          <p className="text-sm text-muted-foreground leading-6">
            Fill out the details below and submit your request for review.
          </p>
        </div>

        {/* Two-column responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Form Section (8 columns) */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-bg-primary border border-bg-muted shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-text-primary leading-6">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Leave Details
                  </CardTitle>
                  {lastSavedTime && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
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
                <div className="flex justify-end gap-4 pt-4 border-t border-muted mt-10 px-6 pb-6">
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
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:scale-[1.02] hover:shadow-md"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT: Unified Guidance Panel (4 columns) */}
          <aside className="lg:col-span-4">
            <LeaveSummarySidebar
              type={type}
              dateRange={dateRange}
              requestedDays={requestedDays}
              remainingBalance={remainingBalance}
              balancesLoading={balancesLoading}
              balancesError={Boolean(balancesError)}
              warnings={warnings}
              projectedBalancePercent={projectedBalancePercent}
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all hover:scale-[1.02]"
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
