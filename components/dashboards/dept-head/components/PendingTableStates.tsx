"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, CheckCircle2 } from "lucide-react";

export function PendingTableLoading() {
  return (
    <Card className="rounded-2xl border-muted/60 shadow-sm">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="border rounded-lg">
          <Skeleton className="h-64 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PendingTableError({
  error,
  onRetry,
}: {
  error?: any;
  onRetry: () => void;
}) {
  return (
    <Card className="rounded-2xl border-muted/60 shadow-sm">
      <CardHeader>
        <CardTitle>Pending Requests</CardTitle>
      </CardHeader>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="text-sm font-semibold text-data-error">
            Failed to load requests
          </div>
          <p className="text-xs text-muted-foreground">
            {error?.message || "Please refresh the page or try again later."}
          </p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PendingTableEmpty() {
  return (
    <Card className="rounded-2xl border-muted/60 shadow-sm">
      <CardHeader>
        <CardTitle>Pending Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-12 text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-muted/60">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-data-success" />
          <h3 className="text-lg font-semibold mb-2">All clear!</h3>
          <p className="text-sm text-muted-foreground">
            No pending approvals at the moment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PendingTableNoResults() {
  return (
    <Card className="py-12">
      <CardContent className="text-center">
        <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="font-semibold mb-2">No requests match your filters</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting filters or check approved requests.
        </p>
      </CardContent>
    </Card>
  );
}
