import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PageShell({
  title,
  description,
  actions,
  breadcrumbs,
  children,
  className,
  contentClassName,
}: PageShellProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-6",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        {breadcrumbs}
        {(title || description || actions) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              {title && <h1 className="heading-lg">{title}</h1>}
              {description && (
                <p className="body-muted max-w-3xl">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={cn("space-y-6", contentClassName)}>{children}</div>
    </section>
  );
}
