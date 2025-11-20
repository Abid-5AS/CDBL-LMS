import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardGridProps = {
  children: ReactNode;
  className?: string;
  columns?: "2" | "3" | "4";
  dense?: boolean;
};

const columnMap: Record<NonNullable<DashboardGridProps["columns"]>, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 xl:grid-cols-3",
  "4": "sm:grid-cols-2 xl:grid-cols-4",
};

export function DashboardGrid({
  children,
  className,
  columns = "3",
  dense = false,
}: DashboardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1",
        columnMap[columns],
        dense ? "gap-3 sm:gap-4" : "gap-4 sm:gap-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
