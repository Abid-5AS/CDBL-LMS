"use client";

import * as React from "react";
import { Search, Eye, Download, RefreshCw } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import type { Column } from "../enhanced-data-table";

interface TableToolbarProps<T> {
  columns: Column<T>[];
  globalFilter: string;
  columnVisibility: Record<string, boolean>;
  onGlobalFilterChange: (value: string) => void;
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  enableGlobalFilter?: boolean;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
}

export function TableToolbar<T>({
  columns,
  globalFilter,
  columnVisibility,
  onGlobalFilterChange,
  onColumnVisibilityChange,
  onExport,
  onRefresh,
  enableGlobalFilter = true,
  enableColumnVisibility = true,
  enableExport = false,
}: TableToolbarProps<T>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {enableGlobalFilter && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => onGlobalFilterChange(e.target.value)}
              className="pl-8 h-8 w-64"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={columnVisibility[column.id] !== false}
                  onCheckedChange={(checked) =>
                    onColumnVisibilityChange(column.id, checked)
                  }
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {enableExport && onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}

        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
