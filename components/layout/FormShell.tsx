import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function FormShell({
  title,
  description,
  actions,
  children,
  footer,
  className,
  contentClassName,
}: FormShellProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-outline/60 bg-surface-1 shadow-card dark:border-border",
        "p-6 sm:p-8 space-y-6",
        className,
      )}
    >
      {(title || description || actions) && (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title && <h2 className="heading-md">{title}</h2>}
            {description && (
              <p className="body-muted max-w-2xl">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </header>
      )}

      <div className={cn("space-y-6", contentClassName)}>{children}</div>

      {footer && (
        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-border/60 pt-4">
          {footer}
        </footer>
      )}
    </div>
  );
}
