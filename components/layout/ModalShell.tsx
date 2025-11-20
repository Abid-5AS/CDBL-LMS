import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalShellProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  contentClassName?: string;
};

const sizeClasses: Record<NonNullable<ModalShellProps["size"]>, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-3xl",
};

export function ModalShell({
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  contentClassName,
}: ModalShellProps) {
  return (
    <div
      className={cn(
        "w-[min(100vw-2rem,900px)] rounded-2xl border border-outline/60 dark:border-border bg-card shadow-panel",
        "p-6 sm:p-8 space-y-6",
        sizeClasses[size],
        className,
      )}
    >
      {(title || description) && (
        <header className="space-y-1">
          {title && <h3 className="heading-md">{title}</h3>}
          {description && <p className="body-muted">{description}</p>}
        </header>
      )}

      <div className={cn("space-y-4", contentClassName)}>{children}</div>

      {footer && (
        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-border/60 pt-4">
          {footer}
        </footer>
      )}
    </div>
  );
}
