"use client";

import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { createContext, isValidElement, useContext, useState } from "react";
import { ArrowDown, ChevronUp, Copy, Edit, HelpCircle, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Context for table configuration
const TableContext = createContext<{ size: "sm" | "md" }>({ size: "md" });

// Row Actions Dropdown Component
export const TableRowActionsDropdown = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>
        <Edit className="mr-2 size-4" aria-hidden="true" />
        <span>Edit</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Copy className="mr-2 size-4" aria-hidden="true" />
        <span>Copy link</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="text-destructive">
        <Trash2 className="mr-2 size-4" aria-hidden="true" />
        <span>Delete</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// Table Card Root Container
const TableCardRoot = ({ 
  children, 
  className, 
  size = "md", 
  ...props 
}: HTMLAttributes<HTMLDivElement> & { size?: "sm" | "md" }) => {
  return (
    <TableContext.Provider value={{ size }}>
      <div 
        {...props} 
        className={cn(
          "overflow-hidden rounded-xl bg-bg-primary shadow-sm ring-1 ring-border-strong", 
          className
        )}
      >
        {children}
      </div>
    </TableContext.Provider>
  );
};

// Table Card Header
interface TableCardHeaderProps {
  /** The title of the table card header. */
  title: string;
  /** The badge displayed next to the title. */
  badge?: ReactNode;
  /** The description of the table card header. */
  description?: string;
  /** The content displayed after the title and badge. */
  contentTrailing?: ReactNode;
  /** The class name of the table card header. */
  className?: string;
}

const TableCardHeader = ({ 
  title, 
  badge, 
  description, 
  contentTrailing, 
  className 
}: TableCardHeaderProps) => {
  const { size } = useContext(TableContext);

  return (
    <div
      className={cn(
        "relative flex flex-col items-start gap-4 border-b border-border-strong bg-bg-primary px-4 md:flex-row",
        size === "sm" ? "py-4 md:px-5" : "py-5 md:px-6",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h2 className={cn(
            "font-semibold text-text-primary", 
            size === "sm" ? "text-md" : "text-lg"
          )}>
            {title}
          </h2>
          {badge && (
            isValidElement(badge) ? (
              badge
            ) : (
              <Badge variant="secondary" className="h-fit">
                {badge}
              </Badge>
            )
          )}
        </div>
        {description && (
          <p className="text-sm text-text-tertiary">{description}</p>
        )}
      </div>
      {contentTrailing}
    </div>
  );
};

// Enhanced Table Root with sorting and selection
interface ModernTableProps extends ComponentPropsWithRef<"table"> {
  size?: "sm" | "md";
  enableSelection?: boolean;
  onSelectionChange?: (selectedRows: string[]) => void;
}

const ModernTableRoot = ({ 
  className, 
  size = "md", 
  enableSelection = false,
  onSelectionChange,
  children,
  ...props 
}: ModernTableProps) => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const handleSelectionChange = (rowId: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedRows, rowId]
      : selectedRows.filter(id => id !== rowId);
    
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  const context = useContext(TableContext);

  return (
    <TableContext.Provider value={{ size: context?.size ?? size }}>
      <div className="overflow-x-auto">
        <table 
          className={cn("w-full overflow-x-hidden", className)} 
          {...props}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
};

// Table Header with optional selection
interface ModernTableHeaderProps extends ComponentPropsWithRef<"thead"> {
  bordered?: boolean;
  enableSelection?: boolean;
  selectedCount?: number;
  totalCount?: number;
  onSelectAll?: (checked: boolean) => void;
}

const ModernTableHeader = ({ 
  bordered = true, 
  className,
  enableSelection = false,
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  children,
  ...props 
}: ModernTableHeaderProps) => {
  const { size } = useContext(TableContext);
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  return (
    <thead
      {...props}
      className={cn(
        "relative bg-bg-secondary",
        size === "sm" ? "h-9" : "h-11",
        // Row border using after pseudo-element
        bordered && "[&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary",
        className,
      )}
    >
      {enableSelection ? (
        <tr>
          <th
            scope="col"
            className={cn(
              "relative py-2 pr-0 pl-4",
              size === "sm" ? "w-9 md:pl-5" : "w-11 md:pl-6"
            )}
          >
            <div className="flex items-start">
              <Checkbox
                checked={isAllSelected}
                // @ts-ignore - Radix checkbox supports indeterminate
                ref={(el: any) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onCheckedChange={onSelectAll}
                aria-label="Select all rows"
              />
            </div>
          </th>
          {children}
        </tr>
      ) : (
        children
      )}
    </thead>
  );
};

// Table Head with sorting support
interface ModernTableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  label?: string;
  tooltip?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

const ModernTableHead = ({
  className,
  tooltip,
  label,
  sortable = false,
  sortDirection = null,
  onSort,
  children,
  ...props
}: ModernTableHeadProps) => {
  return (
    <th
      {...props}
      scope="col"
      className={cn(
        "relative p-0 px-6 py-2 text-left outline-none",
        sortable && "cursor-pointer hover:bg-bg-tertiary/50",
        className,
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1">
          {label && (
            <span className="text-xs font-semibold whitespace-nowrap text-text-quaternary">
              {label}
            </span>
          )}
          {children}
        </div>

        {tooltip && (
          <Tooltip>
            <TooltipTrigger className="cursor-pointer text-text-quaternary transition duration-100 ease-linear hover:text-text-primary">
              <HelpCircle className="size-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}

        {sortable && (
          sortDirection === 'asc' ? (
            <ArrowDown className="size-3 stroke-[3px] text-text-quaternary rotate-180" aria-hidden="true" />
          ) : sortDirection === 'desc' ? (
            <ArrowDown className="size-3 stroke-[3px] text-text-quaternary" aria-hidden="true" />
          ) : (
            <ChevronUp className="size-3 stroke-[3px] text-text-quaternary" aria-hidden="true" />
          )
        )}
      </div>
    </th>
  );
};

// Table Row with selection and hover states
interface ModernTableRowProps extends ComponentPropsWithRef<"tr"> {
  highlightSelectedRow?: boolean;
  enableSelection?: boolean;
  rowId?: string;
  isSelected?: boolean;
  onSelectionChange?: (rowId: string, checked: boolean) => void;
}

const ModernTableRow = ({ 
  className, 
  highlightSelectedRow = true,
  enableSelection = false,
  rowId = "",
  isSelected = false,
  onSelectionChange,
  children,
  ...props 
}: ModernTableRowProps) => {
  const { size } = useContext(TableContext);

  return (
    <tr
      {...props}
      className={cn(
        "relative transition-colors hover:bg-bg-secondary focus-within:bg-bg-secondary",
        size === "sm" ? "h-14" : "h-18",
        highlightSelectedRow && isSelected && "bg-bg-secondary",
        // Row border using after pseudo-element
        "[&>td]:after:absolute [&>td]:after:inset-x-0 [&>td]:after:bottom-0 [&>td]:after:h-px [&>td]:after:w-full [&>td]:after:bg-border-secondary last:[&>td]:after:hidden",
        className,
      )}
    >
      {enableSelection && (
        <td className={cn(
          "relative py-2 pr-0 pl-4",
          size === "sm" ? "md:pl-5" : "md:pl-6"
        )}>
          <div className="flex items-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onSelectionChange?.(rowId, !!checked)
              }
              aria-label={`Select row ${rowId}`}
            />
          </div>
        </td>
      )}
      {children}
    </tr>
  );
};

// Table Cell with responsive styling
interface ModernTableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  ref?: Ref<HTMLTableCellElement>;
}

const ModernTableCell = ({ 
  className, 
  children, 
  ...props 
}: ModernTableCellProps) => {
  const { size } = useContext(TableContext);

  return (
    <td
      {...props}
      className={cn(
        "relative text-sm text-text-tertiary",
        size === "sm" && "px-5 py-3",
        size === "md" && "px-6 py-4",
        className,
      )}
    >
      {children}
    </td>
  );
};

// Table Body - standard tbody
const ModernTableBody = ({ className, ...props }: ComponentPropsWithRef<"tbody">) => {
  return (
    <tbody
      className={cn("divide-y divide-border-secondary", className)}
      {...props}
    />
  );
};

// Export card components
const ModernTableCard = {
  Root: TableCardRoot,
  Header: TableCardHeader,
};

// Export main table with subcomponents
const ModernTable = ModernTableRoot as typeof ModernTableRoot & {
  Body: typeof ModernTableBody;
  Cell: typeof ModernTableCell;
  Head: typeof ModernTableHead;
  Header: typeof ModernTableHeader;
  Row: typeof ModernTableRow;
  Card: typeof ModernTableCard;
  RowActions: typeof TableRowActionsDropdown;
};

ModernTable.Body = ModernTableBody;
ModernTable.Cell = ModernTableCell;
ModernTable.Head = ModernTableHead;
ModernTable.Header = ModernTableHeader;
ModernTable.Row = ModernTableRow;
ModernTable.Card = ModernTableCard;
ModernTable.RowActions = TableRowActionsDropdown;

export { ModernTable, ModernTableCard };