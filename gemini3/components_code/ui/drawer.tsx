"use client";

import * as React from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, GripHorizontal } from "lucide-react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;

  // Position
  side?: "top" | "right" | "bottom" | "left";

  // Size
  size?: "sm" | "md" | "lg" | "xl" | "full";

  // Behavior
  modal?: boolean;
  dismissible?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;

  // Gestures
  swipeToClose?: boolean;
  swipeThreshold?: number;

  // Styling
  className?: string;
  overlayClassName?: string;

  // Callbacks
  onClose?: () => void;
  onOpen?: () => void;
}

const sideClasses = {
  top: {
    container: "top-0 left-0 right-0",
    content: "w-full",
    transform: "translateY(-100%)",
    swipeDirection: "y",
  },
  right: {
    container: "top-0 right-0 bottom-0",
    content: "h-full",
    transform: "translateX(100%)",
    swipeDirection: "x",
  },
  bottom: {
    container: "bottom-0 left-0 right-0",
    content: "w-full",
    transform: "translateY(100%)",
    swipeDirection: "y",
  },
  left: {
    container: "top-0 left-0 bottom-0",
    content: "h-full",
    transform: "translateX(-100%)",
    swipeDirection: "x",
  },
};

const sizeClasses = {
  sm: {
    top: "max-h-[25vh]",
    right: "max-w-sm",
    bottom: "max-h-[25vh]",
    left: "max-w-sm",
  },
  md: {
    top: "max-h-[50vh]",
    right: "max-w-md",
    bottom: "max-h-[50vh]",
    left: "max-w-md",
  },
  lg: {
    top: "max-h-[75vh]",
    right: "max-w-lg",
    bottom: "max-h-[75vh]",
    left: "max-w-lg",
  },
  xl: {
    top: "max-h-[90vh]",
    right: "max-w-xl",
    bottom: "max-h-[90vh]",
    left: "max-w-xl",
  },
  full: {
    top: "h-full",
    right: "w-full",
    bottom: "h-full",
    left: "w-full",
  },
};

const slideVariants = {
  top: {
    initial: { y: "-100%" },
    animate: { y: 0 },
    exit: { y: "-100%" },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
  bottom: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },
  left: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
};

export function Drawer({
  open,
  onOpenChange,
  children,
  side = "right",
  size = "md",
  modal = true,
  dismissible = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventScroll = true,
  swipeToClose = true,
  swipeThreshold = 100,
  className,
  overlayClassName,
  onClose,
  onOpen,
}: DrawerProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);

  // Handle open/close callbacks
  React.useEffect(() => {
    if (open) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [open, onOpen, onClose]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (!preventScroll || !modal) return;

    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, preventScroll, modal]);

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

  // Handle swipe to close
  const handleDragStart = () => {
    if (!swipeToClose) return;
    setIsDragging(true);
  };

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!swipeToClose || !isDragging) return;

    const { offset } = info;
    const relevantOffset =
      side === "left" || side === "right" ? offset.x : offset.y;

    // Only allow dragging in the close direction
    const shouldClose =
      (side === "left" && relevantOffset < 0) ||
      (side === "right" && relevantOffset > 0) ||
      (side === "top" && relevantOffset < 0) ||
      (side === "bottom" && relevantOffset > 0);

    if (shouldClose) {
      setDragOffset(Math.abs(relevantOffset));
    }
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!swipeToClose || !isDragging) return;

    setIsDragging(false);
    const { offset, velocity } = info;
    const relevantOffset =
      side === "left" || side === "right" ? offset.x : offset.y;
    const relevantVelocity =
      side === "left" || side === "right" ? velocity.x : velocity.y;

    // Check if should close based on distance or velocity
    const shouldClose =
      Math.abs(relevantOffset) > swipeThreshold ||
      Math.abs(relevantVelocity) > 500;

    const isClosingDirection =
      (side === "left" && relevantOffset < 0) ||
      (side === "right" && relevantOffset > 0) ||
      (side === "top" && relevantOffset < 0) ||
      (side === "bottom" && relevantOffset > 0);

    if (shouldClose && isClosingDirection) {
      onOpenChange(false);
    }

    setDragOffset(0);
  };

  const sideConfig = sideClasses[side];
  const variants = slideVariants[side];

  if (!open) return null;

  const drawerContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          {modal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute inset-0 bg-black/50",
                overlayClassName
              )}
              onClick={
                closeOnOverlayClick ? () => onOpenChange(false) : undefined
              }
            />
          )}

          {/* Drawer */}
          <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            drag={
              swipeToClose
                ? side === "left" || side === "right"
                  ? "x"
                  : "y"
                : false
            }
            dragConstraints={{
              [side === "left" || side === "right" ? "left" : "top"]: 0,
              [side === "left" || side === "right" ? "right" : "bottom"]: 0,
            }}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bg-background border shadow-lg",
              sideConfig.container,
              sideConfig.content,
              sizeClasses[size][side],
              side === "top" && "border-b rounded-b-2xl",
              side === "right" && "border-l rounded-l-2xl",
              side === "bottom" && "border-t rounded-t-2xl",
              side === "left" && "border-r rounded-r-2xl",
              className
            )}
            style={{
              transform: isDragging
                ? `translate${
                    side === "left" || side === "right" ? "X" : "Y"
                  }(${
                    side === "left"
                      ? -dragOffset
                      : side === "right"
                      ? dragOffset
                      : side === "top"
                      ? -dragOffset
                      : dragOffset
                  }px)`
                : undefined,
            }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render in portal
  if (typeof window !== "undefined") {
    return createPortal(drawerContent, document.body);
  }

  return null;
}

// Drawer Header Component
export interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  showHandle?: boolean;
  onClose?: () => void;
}

export function DrawerHeader({
  children,
  className,
  showCloseButton = true,
  showHandle = false,
  onClose,
}: DrawerHeaderProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {showHandle && (
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex-1">{children}</div>

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

// Drawer Body Component
export interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  padding?: boolean;
}

export function DrawerBody({
  children,
  className,
  scrollable = true,
  padding = true,
}: DrawerBodyProps) {
  return (
    <div
      className={cn(
        "flex-1",
        scrollable && "overflow-y-auto",
        padding && "p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

// Drawer Footer Component
export interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
  justify?: "start" | "center" | "end" | "between";
}

export function DrawerFooter({
  children,
  className,
  justify = "end",
}: DrawerFooterProps) {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 border-t border-border/50",
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
}

// Hook for drawer state management
export function useDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);

  const openDrawer = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDrawer = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    setIsOpen,
  };
}
