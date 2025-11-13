"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../button";

interface TablePaginationProps {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  onPaginationChange: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
}

export function TablePagination({
  pageIndex,
  pageSize,
  totalRows,
  onPaginationChange,
}: TablePaginationProps) {
  const pageCount = Math.ceil(totalRows / pageSize);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < pageCount - 1;

  const handlePrevious = () => {
    if (canPreviousPage) {
      onPaginationChange({ pageIndex: pageIndex - 1, pageSize });
    }
  };

  const handleNext = () => {
    if (canNextPage) {
      onPaginationChange({ pageIndex: pageIndex + 1, pageSize });
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPaginationChange({ pageIndex: 0, pageSize: newPageSize });
  };

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {pageIndex * pageSize + 1} to{" "}
          {Math.min((pageIndex + 1) * pageSize, totalRows)} of {totalRows}{" "}
          results
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
          <span>Rows per page:</span>
          <select
            className="border rounded px-2 py-1 bg-background"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!canPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-sm font-medium">
          Page {pageIndex + 1} of {pageCount || 1}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
