import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Intent = "success" | "warning" | "danger" | "info" | "neutral" | "muted";
type Variant = "soft" | "solid" | "outline";

const intentStyles: Record<Intent, { text: string; bg: string; border: string; solidText: string; solidBg: string }> = {
  success: {
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    solidText: "text-success-foreground",
    solidBg: "bg-success",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    solidText: "text-warning-foreground",
    solidBg: "bg-warning",
  },
  danger: {
    text: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/30",
    solidText: "text-danger-foreground",
    solidBg: "bg-danger",
  },
  info: {
    text: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    solidText: "text-info-foreground",
    solidBg: "bg-info",
  },
  neutral: {
    text: "text-foreground",
    bg: "bg-surface-2",
    border: "border-outline/70 dark:border-border/70",
    solidText: "text-foreground",
    solidBg: "bg-surface-2",
  },
  muted: {
    text: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-outline/60 dark:border-border/60",
    solidText: "text-foreground",
    solidBg: "bg-muted",
  },
};

type StatusChipProps = {
  label: ReactNode;
  intent?: Intent;
  variant?: Variant;
  icon?: LucideIcon;
  className?: string;
  wrap?: boolean;
};

export function StatusChip({
  label,
  intent = "neutral",
  variant = "soft",
  icon: Icon,
  className,
  wrap = false,
}: StatusChipProps) {
  const styles = intentStyles[intent];

  const base = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium leading-none";

  const variantClass = (() => {
    if (variant === "solid") {
      return cn("border", styles.border, styles.solidBg, styles.solidText);
    }
    if (variant === "outline") {
      return cn("border bg-transparent", styles.border, styles.text);
    }
    return cn("border", styles.bg, styles.border, styles.text);
  })();

  return (
    <span className={cn(base, wrap && "whitespace-normal", !wrap && "whitespace-nowrap", variantClass, className)}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {label}
    </span>
  );
}
