"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { SimplePagination } from "@/components/shared";

export type ColumnDef<T> = {
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  id?: string;
};

export type ActionDef<T> = {
  label: string;
  onClick: (item: T) => void;
  variant?: "default" | "destructive" | "outline" | "ghost";
  icon?: React.ElementType;
  disabled?: (item: T) => boolean;
  loading?: (item: T) => boolean;
};

export type BulkActionDef = {
  label: string;
  onClick: (selectedIds: string[] | number[]) => void;
  variant?: "default" | "destructive" | "outline";
  icon?: React.ElementType;
  loading?: boolean;
};

type LeaveTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionDef<T>[];
  bulkActions?: BulkActionDef[];
  keyField: keyof T;
  selection?: boolean;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  emptyState?: React.ReactNode;
  mobileCardRenderer?: (item: T, isSelected: boolean, toggleSelection: () => void, actions?: React.ReactNode) => React.ReactNode;
};

export function LeaveTable<T extends { [key: string]: any }>({
  data,
  columns,
  actions,
  bulkActions,
  keyField,
  selection = false,
  onRowClick,
  isLoading,
  pagination,
  emptyState,
  mobileCardRenderer,
}: LeaveTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map((item) => item[keyField]));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="w-full">{emptyState || <div className="p-8 text-center text-muted-foreground">No data available</div>}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selection && selectedIds.length > 0 && bulkActions && (
        <div className="flex items-center justify-between p-4 bg-muted/30 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => (
              <Button
                key={idx}
                size="sm"
                variant={action.variant || "outline"}
                onClick={() => action.onClick(selectedIds as any)}
                disabled={action.loading}
              >
                {action.loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {action.icon && !action.loading && <action.icon className="mr-2 h-3.5 w-3.5" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selection && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const id = item[keyField];
              const isSelected = selectedIds.includes(id);

              return (
                <TableRow
                  key={String(id)}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                  onClick={() => onRowClick?.(item)}
                >
                  {selection && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(id, !!checked)}
                        aria-label={`Select row ${id}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((col, idx) => (
                    <TableCell key={idx} className={col.className}>
                      {col.cell ? col.cell(item) : item[col.accessorKey!]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action, idx) => {
                           const isDisabled = action.disabled?.(item);
                           const isLoading = action.loading?.(item);
                           
                           if (actions.length > 2) {
                             // If many actions, maybe use a dropdown or just icon buttons?
                             // For now, let's render them as icon buttons if icon exists, else text
                             return (
                               <Button
                                 key={idx}
                                 variant={action.variant || "ghost"}
                                 size="sm"
                                 onClick={() => action.onClick(item)}
                                 disabled={isDisabled || isLoading}
                                 className="h-8 w-8 p-0"
                                 title={action.label}
                               >
                                 {isLoading ? (
                                   <Loader2 className="h-4 w-4 animate-spin" />
                                 ) : action.icon ? (
                                   <action.icon className="h-4 w-4" />
                                 ) : (
                                   <span className="text-xs">{action.label}</span>
                                 )}
                               </Button>
                             );
                           }
                           
                           return (
                              <Button
                                key={idx}
                                variant={action.variant || "outline"}
                                size="sm"
                                onClick={() => action.onClick(item)}
                                disabled={isDisabled || isLoading}
                              >
                                {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                {action.icon && !isLoading && <action.icon className="mr-2 h-3.5 w-3.5" />}
                                {action.label}
                              </Button>
                           );
                        })}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item) => {
          const id = item[keyField];
          const isSelected = selectedIds.includes(id);
          
          const actionButtons = actions && (
             <div className="flex items-center gap-2 mt-4 justify-end">
                {actions.map((action, idx) => {
                   const isDisabled = action.disabled?.(item);
                   const isLoading = action.loading?.(item);
                   return (
                      <Button
                        key={idx}
                        variant={action.variant || "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(item);
                        }}
                        disabled={isDisabled || isLoading}
                      >
                        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        {action.icon && !isLoading && <action.icon className="mr-2 h-3.5 w-3.5" />}
                        {action.label}
                      </Button>
                   );
                })}
             </div>
          );

          return (
            <div key={String(id)} onClick={() => onRowClick?.(item)}>
              {mobileCardRenderer ? (
                mobileCardRenderer(item, isSelected, () => handleSelectRow(id, !isSelected), actionButtons)
              ) : (
                <div className="p-4 border rounded-lg bg-card shadow-sm">
                   {/* Default fallback card if no renderer provided */}
                   <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                         {selection && (
                            <Checkbox 
                               checked={isSelected} 
                               onCheckedChange={(checked) => handleSelectRow(id, !!checked)}
                            />
                         )}
                         <div>
                            {columns.map((col, idx) => (
                               <div key={idx} className="mb-1">
                                  <span className="text-xs text-muted-foreground mr-2">{col.header}:</span>
                                  <span className="text-sm font-medium">{col.cell ? col.cell(item) : item[col.accessorKey!]}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                   {actionButtons}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4">
          <SimplePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            showPageInfo={true}
          />
        </div>
      )}
    </div>
  );
}
