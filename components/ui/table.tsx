"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="neo-table-container relative w-full overflow-hidden rounded-2xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] shadow-[var(--shadow-1)] backdrop-blur-sm"
      role="region"
      aria-label="Data table"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        role="table"
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b [&_tr]:border-[var(--shell-card-border)]",
        "[&_tr]:bg-gradient-to-br [&_tr]:from-[var(--color-card-elevated)]/50 [&_tr]:to-transparent",
        "[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-10 [&_tr]:backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0",
        "[&_tr:hover]:bg-gradient-to-r [&_tr:hover]:from-[rgba(91,94,252,0.04)] [&_tr:hover]:to-transparent",
        "[&_tr]:transition-all [&_tr]:duration-200",
        className
      )}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-[var(--shell-card-border)]/40",
        "hover:bg-gradient-to-r hover:from-[rgba(91,94,252,0.04)] hover:to-transparent",
        "data-[state=selected]:bg-gradient-to-r data-[state=selected]:from-[rgba(91,94,252,0.08)] data-[state=selected]:to-transparent",
        "data-[state=selected]:border-[rgba(91,94,252,0.2)]",
        "transition-all duration-200 ease-out",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-5 text-left align-middle",
        "text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
        "text-[var(--color-foreground-subtle)]",
        "whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-5 py-4 align-middle text-sm",
        "text-[var(--color-text-secondary)]",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
