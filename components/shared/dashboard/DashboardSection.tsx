import { cn } from "@/lib/utils";
import { getTypography } from "@/lib/ui/density-modes";

interface DashboardSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  id?: string;
}

export function DashboardSection({
  title,
  description,
  children,
  className,
  headerClassName,
  id,
}: DashboardSectionProps) {
  const typography = getTypography("comfortable");

  return (
    <section id={id} className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className={cn("mb-4", headerClassName)}>
          {title && <h2 className={typography.sectionTitle}>{title}</h2>}
          {description && (
            <p className={cn(typography.label, "!normal-case mt-1 text-muted-foreground")}>
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
