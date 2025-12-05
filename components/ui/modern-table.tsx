'use client';

import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';
import { Button } from './button';
import { Input } from './input';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
  className?: string;
}

export interface ModernTableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  paginated?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function ModernTable<T extends Record<string, any>>({
  data,
  columns,
  caption,
  searchable = false,
  searchPlaceholder = 'Search...',
  paginated = false,
  pageSize = 10,
  emptyMessage = 'No data available',
  loading = false,
  onRowClick,
  className,
}: ModernTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Use React 19's useDeferredValue instead of manual debouncing
  // This allows React to prioritize urgent updates (like typing) over expensive filtering
  const deferredSearchTerm = useDeferredValue(searchInput);

  // Reset to first page when search changes
  useEffect(() => {
    if (deferredSearchTerm !== searchInput) {
      setCurrentPage(1);
    }
  }, [deferredSearchTerm, searchInput]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  // Pre-compute searchable strings for better performance
  const searchableData = useMemo(() =>
    sortedData.map(row => ({
      ...row,
      _searchText: Object.values(row)
        .filter(val => val !== null && val !== undefined)
        .join(' ')
        .toLowerCase()
    })),
    [sortedData]
  );

  // Search/filter logic - optimized with pre-computed search strings
  // Uses deferredSearchTerm so UI remains responsive while filtering
  const filteredData = useMemo(() => {
    if (!deferredSearchTerm) return searchableData;

    const term = deferredSearchTerm.toLowerCase();
    return searchableData.filter(row => row._searchText.includes(term));
  }, [searchableData, deferredSearchTerm]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;

    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, paginated, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Sort handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(
        sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4 ml-1" />;
    return <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          {caption && <TableCaption>{caption}</TableCaption>}
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={`${column.className || ''} ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && <SortIcon columnKey={column.key} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
