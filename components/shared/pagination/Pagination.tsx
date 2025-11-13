/**
 * Shared pagination components
 * Consistent pagination UI across the application
 */

"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Standard pagination component with page numbers
 */
type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  className?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = false,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
        // Near the start
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
        // Near the end
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        const start = currentPage - Math.floor(maxVisiblePages / 2);
        for (let i = start; i < start + maxVisiblePages; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex items-center justify-center gap-2 ${className || ""}`}>
      {showFirstLast && currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          className="hidden sm:inline-flex"
        >
          First
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showFirstLast && currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="hidden sm:inline-flex"
        >
          Last
        </Button>
      )}
    </div>
  );
}

/**
 * Simple previous/next pagination
 */
type SimplePaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  className?: string;
};

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  className,
}: SimplePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between ${className || ""}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      {showPageInfo && (
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

/**
 * Compact pagination for mobile/small spaces
 */
type CompactPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: CompactPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-xs text-muted-foreground min-w-[60px] text-center">
        {currentPage} / {totalPages}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Pagination with smooth scroll to element
 * Useful for tables that need to scroll to top on page change
 */
type ScrollingPaginationProps = PaginationProps & {
  scrollToElementId?: string;
  scrollBehavior?: ScrollBehavior;
  scrollDelay?: number;
};

export function ScrollingPagination({
  scrollToElementId,
  scrollBehavior = "smooth",
  scrollDelay = 100,
  ...props
}: ScrollingPaginationProps) {
  const handlePageChange = (page: number) => {
    props.onPageChange(page);

    if (scrollToElementId) {
      setTimeout(() => {
        const element = document.getElementById(scrollToElementId);
        if (element) {
          element.scrollIntoView({ behavior: scrollBehavior, block: "start" });
        }
      }, scrollDelay);
    }
  };

  return <Pagination {...props} onPageChange={handlePageChange} />;
}

/**
 * Pagination info - shows "Showing X to Y of Z results"
 */
type PaginationInfoProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  className?: string;
};

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className,
}: PaginationInfoProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <p className={`text-sm text-muted-foreground ${className || ""}`}>
      Showing <span className="font-medium">{start}</span> to{" "}
      <span className="font-medium">{end}</span> of{" "}
      <span className="font-medium">{totalItems}</span> results
    </p>
  );
}

/**
 * Complete pagination with info
 */
type CompletePaginationProps = PaginationProps & {
  pageSize: number;
  totalItems: number;
  showInfo?: boolean;
};

export function CompletePagination({
  pageSize,
  totalItems,
  showInfo = true,
  ...props
}: CompletePaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {showInfo && (
        <PaginationInfo
          currentPage={props.currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
        />
      )}
      <Pagination {...props} />
    </div>
  );
}
