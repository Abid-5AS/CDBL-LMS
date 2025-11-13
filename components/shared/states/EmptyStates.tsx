/**
 * Shared empty state components
 * Consistent empty state UI across the application
 */

"use client";

import { ReactNode } from "react";
import {
  Inbox,
  Search,
  FileQuestion,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Generic empty state component
 */
type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={`py-12 text-center ${className || ""}`}>
      <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Empty state card - for card-based layouts
 */
type EmptyStateCardProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "success" | "warning";
  className?: string;
};

export function EmptyStateCard({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateCardProps) {
  const variantClasses = {
    default: "from-muted/30 to-muted/10 border-muted/60",
    success: "from-data-success/10 to-data-success/5 border-data-success/20",
    warning: "from-data-warning/10 to-data-warning/5 border-data-warning/20",
  };

  const iconClasses = {
    default: "text-muted-foreground",
    success: "text-data-success",
    warning: "text-data-warning",
  };

  return (
    <Card className={`rounded-2xl border-muted/60 shadow-sm ${className || ""}`}>
      <CardContent className="p-0">
        <div
          className={`p-12 text-center bg-gradient-to-br rounded-lg border ${variantClasses[variant]}`}
        >
          <Icon className={`h-12 w-12 mx-auto mb-4 ${iconClasses[variant]}`} />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
          )}
          {action && (
            <Button onClick={action.onClick} size="sm">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * No search results state
 */
type NoResultsStateProps = {
  searchQuery?: string;
  onClear?: () => void;
  className?: string;
};

export function NoResultsState({
  searchQuery,
  onClear,
  className,
}: NoResultsStateProps) {
  return (
    <Card className={`py-12 ${className || ""}`}>
      <CardContent className="text-center">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="font-semibold mb-2">No results found</p>
        <p className="text-sm text-muted-foreground mb-4">
          {searchQuery
            ? `No results for "${searchQuery}". Try a different search.`
            : "Try adjusting your filters or search terms."}
        </p>
        {onClear && (
          <Button onClick={onClear} variant="outline" size="sm">
            Clear filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * All clear/success state - when there's no pending work
 */
type AllClearStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function AllClearState({
  title = "All clear!",
  description = "No pending items at the moment.",
  className,
}: AllClearStateProps) {
  return (
    <EmptyStateCard
      icon={CheckCircle2}
      title={title}
      description={description}
      variant="success"
      className={className}
    />
  );
}

/**
 * No data available state
 */
export function NoDataState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No data available"
      description="There's no data to display yet."
      className={className}
    />
  );
}

/**
 * No holidays state
 */
export function NoHolidaysState({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Calendar}
      title="No holidays configured"
      description="Add holidays to enable leave planning."
      action={onAdd ? { label: "Add Holiday", onClick: onAdd } : undefined}
      className={className}
    />
  );
}

/**
 * No leave requests state
 */
export function NoLeaveRequestsState({ className }: { className?: string }) {
  return (
    <EmptyStateCard
      icon={FileText}
      title="No leave requests"
      description="You haven't submitted any leave requests yet."
      className={className}
    />
  );
}

/**
 * No team members state
 */
export function NoTeamMembersState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Users}
      title="No team members"
      description="There are no team members to display."
      className={className}
    />
  );
}

/**
 * Error state - for when data loading fails
 */
type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={`rounded-2xl border-muted/60 shadow-sm ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-data-error" />
          <p className="text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
