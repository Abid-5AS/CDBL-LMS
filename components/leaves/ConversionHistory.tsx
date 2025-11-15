"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRightLeft, Calendar, FileText, Info, ExternalLink, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

export interface ConversionRecord {
  id: number;
  date: string;
  leaveRequestId: number;
  conversionType: "ML_SPLIT" | "CL_TO_EL" | "EL_OVERFLOW";
  originalType: string;
  originalDays: number;
  conversions: Array<{
    type: string;
    days: number;
  }>;
  appliedBy: string;
  policy: string;
}

interface ConversionHistoryProps {
  userId?: number;
  year?: number;
  limit?: number;
  showHeader?: boolean;
}

const CONVERSION_TYPE_LABELS: Record<string, string> = {
  ML_SPLIT: "ML > 14 days conversion",
  CL_TO_EL: "CL > 3 days conversion",
  EL_OVERFLOW: "EL overflow to Special",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  MEDICAL: "ML",
  CASUAL: "CL",
  EARNED: "EL",
  SPECIAL: "Special EL",
  EXTRAWITHOUTPAY: "Extraordinary",
};

export function ConversionHistory({
  userId,
  year = new Date().getFullYear(),
  limit = 10,
  showHeader = true
}: ConversionHistoryProps) {
  const { data, error, isLoading } = useSWR<{ conversions: ConversionRecord[] }>(
    `/api/conversions?userId=${userId || "me"}&year=${year}&limit=${limit}`,
    apiFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const conversions = data?.conversions || [];

  const formatConversionDetails = (record: ConversionRecord): string => {
    const parts = record.conversions.map(c =>
      `${c.days}${LEAVE_TYPE_LABELS[c.type] || c.type}`
    );
    return `${record.originalDays}d → ${parts.join("+")}`;
  };

  const getTotalConverted = (): { count: number; days: number } => {
    return {
      count: conversions.length,
      days: conversions.reduce((sum, c) => sum + c.originalDays, 0),
    };
  };

  const stats = getTotalConverted();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          {showHeader && (
            <>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Conversion History
              </CardTitle>
              <CardDescription>Loading conversion history for {year}...</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load conversion history</AlertDescription>
      </Alert>
    );
  }

  if (conversions.length === 0) {
    return showHeader ? (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Conversion History
          </CardTitle>
          <CardDescription>Your leave conversion history for {year}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No conversions applied in {year}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conversions happen when leave requests exceed policy limits
            </p>
          </div>
        </CardContent>
      </Card>
    ) : null;
  }

  return (
    <Card>
      <CardHeader>
        {showHeader && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Conversion History
                </CardTitle>
                <CardDescription>Your leave conversions for {year}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{stats.count}</p>
                <p className="text-xs text-muted-foreground">conversions</p>
              </div>
            </div>
          </>
        )}
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {showHeader && stats.count > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.count}</p>
              <p className="text-xs text-muted-foreground">Total Conversions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.days}</p>
              <p className="text-xs text-muted-foreground">Days Converted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {new Set(conversions.map(c => c.conversionType)).size}
              </p>
              <p className="text-xs text-muted-foreground">Conversion Types</p>
            </div>
          </div>
        )}

        {/* Conversion Table */}
        <div className="space-y-2">
          {conversions.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 rounded-lg border border-muted hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {CONVERSION_TYPE_LABELS[record.conversionType]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDate(record.date)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatConversionDetails(record)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave Request #{record.leaveRequestId} • {record.policy}
                  </p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/leaves/${record.leaveRequestId}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* View More */}
        {conversions.length >= limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/conversions?year=${year}`}>
                View Full History
                <FileText className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}

        {/* Info */}
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Conversions are automatically applied during leave approval when requests exceed policy limits.
            All conversions follow CDBL leave policy guidelines.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Compact summary version for dashboard
export function ConversionSummaryCard({ userId, year = new Date().getFullYear() }: { userId?: number; year?: number }) {
  const { data } = useSWR<{ conversions: ConversionRecord[] }>(
    `/api/conversions?userId=${userId || "me"}&year=${year}`,
    apiFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const conversions = data?.conversions || [];

  const getTypeCounts = () => {
    const counts = {
      ML_SPLIT: 0,
      CL_TO_EL: 0,
      EL_OVERFLOW: 0,
    };
    conversions.forEach(c => {
      counts[c.conversionType]++;
    });
    return counts;
  };

  const typeCounts = getTypeCounts();
  const totalDays = conversions.reduce((sum, c) => sum + c.originalDays, 0);

  if (conversions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Leave Conversions (This Year)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {typeCounts.ML_SPLIT > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Medical Conversions:</span>
            <span className="font-medium">{typeCounts.ML_SPLIT} requests</span>
          </div>
        )}
        {typeCounts.CL_TO_EL > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Casual Conversions:</span>
            <span className="font-medium">{typeCounts.CL_TO_EL} requests</span>
          </div>
        )}
        {typeCounts.EL_OVERFLOW > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">EL Overflow Transfers:</span>
            <span className="font-medium">{typeCounts.EL_OVERFLOW} times</span>
          </div>
        )}
        <div className="pt-2 border-t border-muted flex items-center justify-between">
          <span className="text-sm font-medium">Total Days Converted:</span>
          <span className="text-lg font-bold text-primary">{totalDays}</span>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/conversions">
            View Full History
            <ExternalLink className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
