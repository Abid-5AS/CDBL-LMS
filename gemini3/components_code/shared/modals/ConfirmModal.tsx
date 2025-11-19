"use client";

import { ReactNode } from "react";
import { UnifiedModal, type ModalMode } from "./UnifiedModal";

type ConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: "default" | "destructive" | "outline";
  isLoading?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
};

/**
 * Confirm Modal Wrapper
 * Simplified wrapper for confirmation dialogs
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
  size = "md",
}: ConfirmModalProps) {
  return (
    <UnifiedModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      mode="confirm"
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmVariant={variant}
      isLoading={isLoading}
      size={size}
    >
      {children}
    </UnifiedModal>
  );
}

