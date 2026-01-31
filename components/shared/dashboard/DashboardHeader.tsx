import { cn } from "@/lib/utils";
import { getTypography } from "@/lib/ui/density-modes";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  title,
  description,
  children,
  className,
}: DashboardHeaderProps) {
  const typography = getTypography("comfortable");

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6", className)}>
      <div>
        <h1 className={cn(typography.pageTitle, "tracking-tight")}>{title}</h1>
        {description && (
          <p className={cn(typography.label, "!normal-case text-muted-foreground mt-1")}>
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
