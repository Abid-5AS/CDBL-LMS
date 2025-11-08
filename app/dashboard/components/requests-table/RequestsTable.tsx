"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { LeaveDetailsModal } from "@/components/shared";
import Link from "next/link";
import clsx from "clsx";
import { type LeaveRow, useLeaveRequests } from "@/hooks/useLeaveRequests";
import { RequestsTableView } from "./RequestsTableView";
import { RequestsCardView } from "./RequestsCardView";
import { filterOptions } from "./filter-options";
import type { MouseEvent } from "react";

type RequestsTableProps = {
  limit?: number;
  showFilter?: boolean;
};

export function RequestsTable({
  limit,
  showFilter = true,
}: RequestsTableProps = {}) {
  const {
    rows,
    allRows,
    filter,
    changeFilter,
    isLoading,
    error,
    enableSelection,
    selection,
    modal,
    cancelRequest,
  } = useLeaveRequests({ limit });

  const handleRowClick = (row: LeaveRow, e: MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest("button") ||
      target.closest("a")
    ) {
      return;
    }
    modal.openDetails(row);
  };

  const headerTitle =
    limit && allRows.length > limit ? "Recent Requests" : "My Leave Requests";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>{headerTitle}</CardTitle>
              {limit && allRows.length > limit && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-indigo-600"
                >
                  <Link href="/leaves">View All</Link>
                </Button>
              )}
            </div>
            {showFilter && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterOptions.map((option) => {
                  const isSelected = filter === option.value;
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => changeFilter(option.value)}
                      className={clsx(
                        "h-8 rounded-full text-xs font-medium transition-all",
                        isSelected
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm"
                          : "bg-bg-primary hover:bg-bg-secondary text-text-secondary border-bg-muted"
                      )}
                      aria-current={isSelected ? "page" : undefined}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <RequestsTableView
              rows={rows}
              filter={filter}
              isLoading={isLoading}
              error={error}
              enableSelection={enableSelection}
              selection={selection}
              onRowClick={handleRowClick}
              cancelRequest={cancelRequest}
            />
          </div>

          <div className="md:hidden space-y-3 p-4">
            <RequestsCardView
              rows={rows}
              filter={filter}
              isLoading={isLoading}
              error={error}
              enableSelection={enableSelection}
              selection={selection}
              onRowClick={handleRowClick}
              onOpenDetails={modal.openDetails}
              cancelRequest={cancelRequest}
            />
          </div>
        </CardContent>
      </Card>

      <LeaveDetailsModal
        open={modal.isOpen}
        onOpenChange={modal.handleOpenChange}
        leave={modal.selectedLeave}
      />
    </>
  );
}
