"use client";

import * as React from "react";
import { Calendar, FileText, CheckCircle, User, Clock } from "lucide-react";
import { motion } from "framer-motion";

import {
  MultiStepWizard,
  useMultiStepWizard,
  EnhancedDatePicker,
  DragDropUpload,
  FloatingLabelInput,
  FloatingLabelTextarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from "@/components/ui";

import { useApplyLeaveForm } from "./use-apply-leave-form";
import { LEAVE_OPTIONS, POLICY_TOOLTIPS, type LeaveType } from "./leave-constants";
import { LeaveSummarySidebar } from "./leave-summary-sidebar";
import { glassCard, neoBadge } from "@/lib/neo-design";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: "leave-type",
    title: "Leave Type",
    description: "Select the type of leave you want to apply for",
    icon: User,
  },
  {
    id: "dates",
    title: "Dates & Duration",
    description: "Choose your leave start and end dates",
    icon: Calendar,
    validation: () => {
      // Add validation logic here
      return true;
    },
  },
  {
    id: "details",
    title: "Details & Reason",
    description: "Provide reason and additional details",
    icon: FileText,
    validation: () => {
      // Add validation logic here
      return true;
    },
  },
  {
    id: "documents",
    title: "Documents",
    description: "Upload supporting documents if required",
    icon: Clock,
    optional: true,
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review your application before submitting",
    icon: CheckCircle,
  },
];

export function MultiStepLeaveForm() {
  const {
    currentStep,
    goToStep,
    nextStep,
    previousStep,
    isLoading,
    setIsLoading,
  } = useMultiStepWizard();

  const {
    type,
    dateRange,
    reason,
    file,
    submitting,
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
    projectedBalancePercent,
    holidays,
    setDateRange,
    setReason,
    setFile,
    handleFileError,
    handleTypeChange,
    clearErrors,
    handleConfirmSubmit,
  } = useApplyLeaveForm();

  const handleNext = async () => {
    // Add step-specific validation here
    nextStep();
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await handleConfirmSubmit();
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Leave Type
        return (
          <Card className={cn(glassCard.elevated, "rounded-2xl")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Leave Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEAVE_OPTIONS.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTypeChange(option.value as LeaveType)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      type === option.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{option.label}</h3>
                      {type === option.value && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {POLICY_TOOLTIPS[option.value]}
                    </p>
                  </motion.button>
                ))}
              </div>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type}</p>
              )}
            </CardContent>
          </Card>
        );

      case 1: // Dates & Duration
        return (
          <Card className={cn(glassCard.elevated, "rounded-2xl")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnhancedDatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(date) =>
                    setDateRange({ ...dateRange, start: date })
                  }
                  holidays={holidays.map((h) => ({
                    date: new Date(h.date),
                    name: h.name,
                  }))}
                  minDate={minSelectableDate}
                  error={errors.start}
                  required
                />
                <EnhancedDatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(date) => setDateRange({ ...dateRange, end: date })}
                  holidays={holidays.map((h) => ({
                    date: new Date(h.date),
                    name: h.name,
                  }))}
                  minDate={dateRange.start || minSelectableDate}
                  error={errors.end}
                  required
                />
              </div>

              {requestedDays > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Duration Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Days:</span>
                      <span className="ml-2 font-medium">{requestedDays}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Leave Type:</span>
                      <span className="ml-2 font-medium">{type}</span>
                    </div>
                  </div>
                </div>
              )}

              {rangeValidation && !rangeValidation.valid && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    {rangeValidation.message}
                  </p>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Please Note:
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2: // Details & Reason
        return (
          <Card className={cn(glassCard.elevated, "rounded-2xl")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Leave Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FloatingLabelTextarea
                label="Reason for Leave"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                error={errors.reason}
                helperText="Please provide a detailed reason for your leave request (minimum 10 characters)"
                required
                rows={4}
              />
            </CardContent>
          </Card>
        );

      case 3: // Documents
        return (
          <Card className={cn(glassCard.elevated, "rounded-2xl")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DragDropUpload
                label={
                  requiresCertificate
                    ? "Medical Certificate (Required)"
                    : "Supporting Documents (Optional)"
                }
                onFilesChange={(files) => {
                  if (files.length > 0) {
                    setFile(files[0].file);
                  } else {
                    setFile(null);
                  }
                }}
                maxFiles={1}
                maxSize={10 * 1024 * 1024} // 10MB
                acceptedTypes={["image/", "application/pdf"]}
                multiple={false}
                error={errors.file}
                helperText={
                  requiresCertificate
                    ? "Medical certificate is required for sick leave over 3 days"
                    : "Upload any supporting documents for your leave request"
                }
                required={requiresCertificate}
              />
            </CardContent>
          </Card>
        );

      case 4: // Review & Submit
        return (
          <Card className={cn(glassCard.elevated, "rounded-2xl")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Review Your Application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Leave Type
                    </h4>
                    <p className="font-semibold">{type}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Duration
                    </h4>
                    <p className="font-semibold">{requestedDays} days</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Dates
                    </h4>
                    <p className="font-semibold">
                      {dateRange.start?.toLocaleDateString()} -{" "}
                      {dateRange.end?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Current Balance
                    </h4>
                    <p className="font-semibold">{balanceForType} days</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Remaining Balance
                    </h4>
                    <p
                      className={`font-semibold ${
                        remainingBalance < 0
                          ? "text-destructive"
                          : "text-green-600"
                      }`}
                    >
                      {remainingBalance} days
                    </p>
                  </div>
                  {file && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Attached Document
                      </h4>
                      <p className="font-semibold">{file.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Reason
                </h4>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{reason}</p>
              </div>

              {warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Important Notes:
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-8">
            <MultiStepWizard
              steps={steps}
              currentStep={currentStep}
              onStepChange={goToStep}
              onNext={handleNext}
              onPrevious={previousStep}
              onComplete={handleComplete}
              isLoading={isLoading || submitting}
              canGoNext={true} // Add validation logic here
              canGoPrevious={currentStep > 0}
              nextButtonText="Continue"
              completeButtonText="Submit Application"
            >
              {renderStepContent()}
            </MultiStepWizard>
          </div>

          {/* Sidebar */}
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
    </div>
  );
}
