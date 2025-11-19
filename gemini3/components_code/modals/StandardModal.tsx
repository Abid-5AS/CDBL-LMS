"use client";

import { ReactNode, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StandardModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  children: ReactNode;
  variant?: "default" | "danger" | "warning" | "info";
  isLoading?: boolean;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  footer?: ReactNode;
  className?: string;
  icon?: ReactNode;
  hideFooter?: boolean;
}

const variantStyles = {
  default: {
    icon: null,
    iconBg: "",
    confirmButton: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
  danger: {
    icon: <AlertTriangle className="h-5 w-5" />,
    iconBg: "bg-destructive/10 text-destructive",
    confirmButton:
      "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    iconBg:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    confirmButton:
      "bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-500 dark:hover:bg-yellow-600",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    confirmButton:
      "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
  },
};

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-[95vw] max-h-[95vh]",
};

export function StandardModal({
  isOpen,
  title,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  children,
  variant = "default",
  isLoading = false,
  description,
  size = "md",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  footer,
  className,
  icon,
  hideFooter = false,
}: StandardModalProps) {
  const variantConfig = variantStyles[variant];

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, isOpen, isLoading, onClose]);

  const handleConfirm = async () => {
    if (onConfirm && !isLoading) {
      await onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "neo-card max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl",
          sizeClasses[size],
          className
        )}
        onPointerDownOutside={(e) => {
          if (!closeOnBackdropClick || isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!closeOnEscape || isLoading) {
            e.preventDefault();
          }
        }}
      >
        {/* Custom close button if needed */}
        {showCloseButton && (
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-4 top-4 rounded-lg opacity-60 hover:opacity-100 transition-all duration-200 hover:bg-[rgba(91,94,252,0.1)] p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(91,94,252)] disabled:pointer-events-none"
          >
            <X className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <span className="sr-only">Close</span>
          </button>
        )}

        <DialogHeader className="border-b border-[var(--shell-card-border)] pb-5">
          {/* Icon for variants */}
          {(icon || variantConfig.icon) && (
            <div
              className={cn(
                "mb-4 inline-flex items-center justify-center rounded-xl p-3 w-12 h-12 shadow-sm",
                variantConfig.iconBg
              )}
            >
              {icon || variantConfig.icon}
            </div>
          )}

          <DialogTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="py-6">{children}</div>

        {/* Footer */}
        {!hideFooter && (
          <DialogFooter className="gap-3 border-t border-[var(--shell-card-border)] pt-5">
            {footer ? (
              footer
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="min-w-[100px] neo-button rounded-xl border-[var(--shell-card-border)] hover:border-[rgb(91,94,252)]/50 hover:bg-[rgba(91,94,252,0.05)] transition-all duration-200"
                >
                  {cancelText}
                </Button>
                {onConfirm && (
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={cn(
                      "min-w-[100px] neo-button rounded-xl transition-all duration-200 shadow-sm hover:shadow-md",
                      variantConfig.confirmButton
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      confirmText
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Convenience wrapper for confirmation dialogs
export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <StandardModal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      isLoading={isLoading}
      size="sm"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </StandardModal>
  );
}

// Convenience wrapper for info/alert dialogs
export interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  variant?: "default" | "danger" | "warning" | "info";
  buttonText?: string;
}

export function AlertModal({
  isOpen,
  title,
  message,
  onClose,
  variant = "info",
  buttonText = "OK",
}: AlertModalProps) {
  return (
    <StandardModal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      variant={variant}
      size="sm"
      hideFooter={false}
      footer={
        <Button onClick={onClose} className="w-full">
          {buttonText}
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </StandardModal>
  );
}

// Example usage component (for documentation)
export function StandardModalExamples() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">StandardModal Examples</h2>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Confirmation</h3>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
          {`<StandardModal
  isOpen={isOpen}
  title="Delete Item?"
  description="This action cannot be undone."
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  variant="danger"
  confirmText="Delete"
  cancelText="Cancel"
>
  <p>Are you sure you want to delete this item?</p>
</StandardModal>`}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Form Modal</h3>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
          {`<StandardModal
  isOpen={isOpen}
  title="Edit Profile"
  size="lg"
  onClose={() => setIsOpen(false)}
  footer={
    <div className="flex gap-2 w-full">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>
        Save Changes
      </Button>
    </div>
  }
>
  <form className="space-y-4">
    {/* Form fields */}
  </form>
</StandardModal>`}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Using ConfirmModal</h3>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
          {`<ConfirmModal
  isOpen={isOpen}
  title="Approve Leave Request?"
  message="This will approve the leave request and notify the employee."
  onConfirm={handleApprove}
  onCancel={() => setIsOpen(false)}
  confirmText="Approve"
  variant="info"
/>`}
        </pre>
      </div>
    </div>
  );
}
