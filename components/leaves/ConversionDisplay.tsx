"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRightLeft, Info, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface ConversionDetails {
  originalType: string;
  originalDays: number;
  conversions: Array<{
    type: string;
    days: number;
    reason?: string;
  }>;
  timestamp: Date | string;
  appliedBy: string;
  policy?: string;
  conversionType?: "ML_SPLIT" | "CL_TO_EL" | "EL_OVERFLOW";
}

interface ConversionDisplayProps {
  leave: {
    id: number;
    type: string;
    workingDays: number;
    conversionDetails?: ConversionDetails;
  };
  showPolicy?: boolean;
  compact?: boolean;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  MEDICAL: "Medical Leave",
  CASUAL: "Casual Leave",
  EARNED: "Earned Leave",
  SPECIAL: "Special Earned Leave",
  EXTRAWITHOUTPAY: "Extraordinary Leave",
  EXTRAWITHPAY: "Extra Leave with Pay",
};

const CONVERSION_TYPE_CONFIG = {
  ML_SPLIT: {
    title: "Medical Leave Converted to Multiple Leave Types",
    icon: "🏥",
    description: "Medical Leave is limited to 14 days/year. Days exceeding this limit are automatically converted to other available leave types (Policy 6.21.c).",
  },
  CL_TO_EL: {
    title: "Casual Leave Converted to Earned Leave",
    icon: "🔄",
    description: "Casual Leave is limited to 3 consecutive days (Policy 6.20.e). Your request has been automatically converted to Earned Leave which provides greater flexibility.",
  },
  EL_OVERFLOW: {
    title: "Earned Leave Overflow to Special Earned Leave",
    icon: "📊",
    description: "Earned Leave is capped at 60 days/year (Policy 6.19.c). Excess balance automatically transfers to Special Earned Leave bucket (max 120 days). Both can be used and encashed as needed.",
  },
};

export function ConversionDisplay({ leave, showPolicy = true, compact = false }: ConversionDisplayProps) {
  if (!leave.conversionDetails) {
    return null;
  }

  const { conversionDetails } = leave;
  const config = conversionDetails.conversionType
    ? CONVERSION_TYPE_CONFIG[conversionDetails.conversionType]
    : null;

  if (compact) {
    return (
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
        <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          <span className="font-semibold">Conversion Applied:</span>{" "}
          {conversionDetails.conversions.length} leave type(s) used
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {config && <span className="text-2xl">{config.icon}</span>}
            <div>
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                {config ? config.title : "Leave Conversion Applied"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Applied on {formatDate(conversionDetails.timestamp)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700">
            <ArrowRightLeft className="h-3 w-3 mr-1" />
            Converted
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Request */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Original Request</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base">
              {LEAVE_TYPE_LABELS[conversionDetails.originalType] || conversionDetails.originalType}
            </Badge>
            <span className="text-2xl font-bold text-foreground">
              {conversionDetails.originalDays}
            </span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>

        {/* Conversion Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-800" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Breakdown After Conversion
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-blue-200 to-transparent dark:from-blue-800" />
          </div>

          <div className="space-y-2">
            {conversionDetails.conversions.map((conversion, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-muted bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {LEAVE_TYPE_LABELS[conversion.type] || conversion.type}
                    </p>
                    {conversion.reason && (
                      <p className="text-xs text-muted-foreground">{conversion.reason}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">{conversion.days}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
            <p className="font-semibold text-foreground">Total Duration</p>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {conversionDetails.conversions.reduce((sum, c) => sum + c.days, 0)}
              </p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
          </div>
        </div>

        {/* Policy Reference */}
        {showPolicy && config && (
          <Alert className="border-blue-300 dark:border-blue-700">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs text-muted-foreground">
              <span className="font-semibold">Policy:</span> {config.description}
            </AlertDescription>
          </Alert>
        )}

        {/* Applied By */}
        <div className="pt-2 border-t border-muted">
          <p className="text-xs text-muted-foreground">
            Conversion applied by <span className="font-medium">{conversionDetails.appliedBy}</span>
            {conversionDetails.policy && (
              <> • Reference: <span className="font-medium">{conversionDetails.policy}</span></>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact badge version for tables/lists
export function ConversionBadge({ hasConversion }: { hasConversion: boolean }) {
  if (!hasConversion) return null;

  return (
    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
      <ArrowRightLeft className="h-3 w-3 mr-1" />
      Converted
    </Badge>
  );
}
