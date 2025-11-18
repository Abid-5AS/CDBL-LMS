"use client";

import { ReactNode, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ModalMode = "confirm" | "nested" | "custom";

type UnifiedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  mode?: ModalMode;
  // Confirm mode props
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmVariant?: "default" | "destructive" | "outline";
  isLoading?: boolean;
  // Nested mode props
  nestedContent?: ReactNode;
  nestedTitle?: string;
  nestedDescription?: string;
  // Custom footer for custom mode
  footer?: ReactNode;
  // Custom styling
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showCloseButton?: boolean;
  disableOutsideClick?: boolean;
};

/**
 * Unified Modal Component
 * Supports confirm, nested, and custom modes
 * Replaces ad-hoc modal implementations across the codebase
 */
export function UnifiedModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  mode = "custom",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "default",
  isLoading = false,
  nestedContent,
  nestedTitle,
  nestedDescription,
  footer,
  className,
  size = "md",
  showCloseButton = true,
  disableOutsideClick = false,
}: UnifiedModalProps) {
  const [showNested, setShowNested] = useState(false);

  // Reset nested state when modal closes
  useEffect(() => {
    if (!open) {
      setShowNested(false);
    }

    // Cleanup function - not strictly necessary for this useEffect but good practice
    return () => {
      // No specific cleanup needed for this component
      // The state will be handled by React's unmounting process
    };
  }, [open]);

  const handleMainClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setShowNested(false);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      await onConfirm();
    }
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  }, [onCancel, onOpenChange]);

  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
  };

  // Render nested dialog if in nested mode and nested is shown
  if (mode === "nested" && showNested && nestedContent) {
    return (
      <>
        {/* Main dialog (hidden when nested is shown) */}
        <Dialog open={open && !showNested} onOpenChange={handleMainClose}>
          <DialogContent
            className={cn("glass-modal", sizeClasses[size], className)}
            showCloseButton={showCloseButton}
          >
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {children}
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                {cancelLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Nested dialog */}
        <Dialog open={showNested} onOpenChange={setShowNested}>
          <DialogContent
            className={cn("glass-modal", sizeClasses[size], className)}
            showCloseButton={showCloseButton}
          >
            <DialogHeader>
              <DialogTitle>{nestedTitle || title}</DialogTitle>
              {nestedDescription && <DialogDescription>{nestedDescription}</DialogDescription>}
            </DialogHeader>
            {nestedContent}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNested(false)} disabled={isLoading}>
                {cancelLabel}
              </Button>
              <Button
                variant={confirmVariant}
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Render confirm mode
  if (mode === "confirm") {
    return (
      <Dialog open={open} onOpenChange={handleMainClose}>
        <DialogContent
          className={cn("glass-modal", sizeClasses[size], className)}
          showCloseButton={showCloseButton}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render custom mode (default)
  return (
    <Dialog open={open} onOpenChange={handleMainClose}>
      <DialogContent
        className={cn("glass-modal", sizeClasses[size], className)}
        showCloseButton={showCloseButton}
        onPointerDownOutside={(e) => {
          if (disableOutsideClick) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (disableOutsideClick) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper function to show nested dialog
 * Use this in your component to trigger nested mode
 */
export function useNestedModal() {
  const [showNested, setShowNested] = useState(false);

  const openNested = useCallback(() => {
    setShowNested(true);
  }, []);

  const closeNested = useCallback(() => {
    setShowNested(false);
  }, []);

  return { showNested, openNested, closeNested };
}

