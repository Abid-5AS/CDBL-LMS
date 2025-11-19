"use client";

import * as React from "react";
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning:
          "border-yellow-500/50 text-yellow-600 dark:text-yellow-500 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10",
        success:
          "border-emerald-500/50 text-emerald-600 dark:text-emerald-500 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10",
        info: "border-blue-500/50 text-blue-600 dark:text-blue-500 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-500 bg-blue-50 dark:bg-blue-900/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  destructive: XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

interface SmartAlertProps
  extends Omit<HTMLMotionProps<"div">, "ref" | "children">,
    VariantProps<typeof alertVariants> {
  title?: string;
  onClose?: () => void;
  children?: React.ReactNode;
}

export function SmartAlert({
  className,
  variant = "default",
  title,
  children,
  onClose,
  ...props
}: SmartAlertProps) {
  const Icon = iconMap[variant || "default"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="h-4 w-4" />
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
            <div className="text-sm [&_p]:leading-relaxed">{children}</div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
