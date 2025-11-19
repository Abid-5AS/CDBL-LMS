"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2, ArrowLeft } from "lucide-react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EnhancedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;

  // Appearance
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  variant?: "default" | "glass" | "blur" | "solid";
  position?: "center" | "top" | "bottom";

  // Behavior
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  trapFocus?: boolean;

  // Features
  resizable?: boolean;
  draggable?: boolean;
  fullscreenable?: boolean;
  stackable?: boolean;

  // Animations
  animationType?: "fade" | "scale" | "slide" | "flip" | "bounce";
  animationDuration?: number;

  // Styling
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;

  // Callbacks
  onClose?: () => void;
  onOpen?: () => void;
  onAnimationComplete?: () => void;
}

const sizeClasses = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[95vw] max-h-[95vh]",
};

const variantClasses = {
  default: "bg-background border border-border shadow-lg",
  glass: "bg-card border border-border shadow-xl", // Mapped to solid card
  blur: "bg-card border border-border shadow-xl", // Mapped to solid card
  solid: "bg-background border-2 border-border shadow-2xl",
};

const positionClasses = {
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  top: "top-[10%] left-1/2 -translate-x-1/2",
  bottom: "bottom-[10%] left-1/2 -translate-x-1/2",
};

const animationVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  slide: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
  },
  flip: {
    initial: { opacity: 0, rotateX: -90 },
    animate: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: 90 },
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
    exit: { opacity: 0, scale: 0.3 },
  },
};

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function EnhancedModal({
  open,
  onOpenChange,
  children,
  size = "md",
  variant = "glass",
  position = "center",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventScroll = true,
  trapFocus = true,
  resizable = false,
  draggable = false,
  fullscreenable = false,
  stackable = false,
  animationType = "scale",
  animationDuration = 0.3,
  className,
  overlayClassName,
  contentClassName,
  onClose,
  onOpen,
  onAnimationComplete,
}: EnhancedModalProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = React.useState(false);
  const [dimensions, setDimensions] = React.useState({
    width: "auto",
    height: "auto",
  });

  const contentRef = React.useRef<HTMLDivElement>(null);
  const dragStartRef = React.useRef({ x: 0, y: 0 });

  // Handle open/close callbacks
  React.useEffect(() => {
    if (open) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [open, onOpen, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (!preventScroll) return;

    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, preventScroll]);

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, closeOnEscape, onOpenChange]);

  // Dragging functionality
  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      if (!draggable || isFullscreen) return;

      setIsDragging(true);
      dragStartRef.current = {
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y,
      };
    },
    [draggable, isFullscreen, dragOffset]
  );

  const handleMouseMove = React.useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return;

      const newOffset = {
        x: event.clientX - dragStartRef.current.x,
        y: event.clientY - dragStartRef.current.y,
      };
      setDragOffset(newOffset);
    },
    [isDragging]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Fullscreen toggle
  const toggleFullscreen = React.useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isFullscreen]);

  // Get animation variants
  const variants = animationVariants[animationType];

  if (!open) return null;

  const modalContent = (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: animationDuration }}
            className={cn(
              "absolute inset-0 bg-black/50",
              variant === "glass" && "bg-black/60",
              overlayClassName
            )}
            onClick={
              closeOnOverlayClick ? () => onOpenChange(false) : undefined
            }
          />

          {/* Modal Content */}
          <motion.div
            ref={contentRef}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: animationDuration }}
            className={cn(
              "relative z-10 w-full rounded-2xl overflow-hidden",
              sizeClasses[isFullscreen ? "full" : size],
              variantClasses[variant],
              !isFullscreen && positionClasses[position],
              isFullscreen && "!max-w-[100vw] !max-h-[100vh] rounded-lg",
              contentClassName,
              className
            )}
            style={{
              transform:
                !isFullscreen && draggable
                  ? `translate(${dragOffset.x}px, ${dragOffset.y}px)`
                  : undefined,
              width: dimensions.width,
              height: dimensions.height,
            }}
            onMouseDown={handleMouseDown}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render in portal
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}

// Modal Header Component
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  showFullscreenButton?: boolean;
  showBackButton?: boolean;
  onClose?: () => void;
  onFullscreen?: () => void;
  onBack?: () => void;
  draggable?: boolean;
}

export function ModalHeader({
  children,
  className,
  showCloseButton = true,
  showFullscreenButton = false,
  showBackButton = false,
  onClose,
  onFullscreen,
  onBack,
  draggable = false,
}: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-6 border-b border-border/50",
        draggable && "cursor-move",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1">{children}</div>
      </div>

      <div className="flex items-center gap-2">
        {showFullscreenButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFullscreen}
            className="h-8 w-8 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}

        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Modal Body Component
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  padding?: boolean;
}

export function ModalBody({
  children,
  className,
  scrollable = true,
  padding = true,
}: ModalBodyProps) {
  return (
    <div
      className={cn(
        "flex-1",
        scrollable && "overflow-y-auto",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

// Modal Footer Component
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  justify?: "start" | "center" | "end" | "between";
}

export function ModalFooter({
  children,
  className,
  justify = "end",
}: ModalFooterProps) {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-6 border-t border-border/50",
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
}

// Modal Stack Context for managing multiple modals
const ModalStackContext = React.createContext<{
  modals: string[];
  addModal: (id: string) => void;
  removeModal: (id: string) => void;
  getZIndex: (id: string) => number;
}>({
  modals: [],
  addModal: () => {},
  removeModal: () => {},
  getZIndex: () => 50,
});

export function ModalStackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modals, setModals] = React.useState<string[]>([]);

  const addModal = React.useCallback((id: string) => {
    setModals((prev) => [...prev, id]);
  }, []);

  const removeModal = React.useCallback((id: string) => {
    setModals((prev) => prev.filter((modalId) => modalId !== id));
  }, []);

  const getZIndex = React.useCallback(
    (id: string) => {
      const index = modals.indexOf(id);
      return index >= 0 ? 50 + index : 50;
    },
    [modals]
  );

  return (
    <ModalStackContext.Provider
      value={{ modals, addModal, removeModal, getZIndex }}
    >
      {children}
    </ModalStackContext.Provider>
  );
}

export function useModalStack(id: string) {
  const context = React.useContext(ModalStackContext);

  React.useEffect(() => {
    context.addModal(id);
    return () => context.removeModal(id);
  }, [id, context]);

  return {
    zIndex: context.getZIndex(id),
    isTopModal: context.modals[context.modals.length - 1] === id,
  };
}

// Confirmation Modal Component
export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Handle error if needed
      console.error("Confirmation action failed:", error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <EnhancedModal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      variant="glass"
      animationType="scale"
    >
      <ModalHeader onClose={() => onOpenChange(false)}>
        <h2 className="text-lg font-semibold">{title}</h2>
      </ModalHeader>

      <ModalBody>
        <p className="text-muted-foreground">{description}</p>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={handleCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Loading..." : confirmText}
        </Button>
      </ModalFooter>
    </EnhancedModal>
  );
}
