"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActionBarAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  disabled?: boolean;
  loading?: boolean;
}

interface ActionBarProps {
  isVisible: boolean;
  title?: string;
  description?: string;
  actions: ActionBarAction[];
  selectedCount?: number;
  variant?: "default" | "success" | "warning" | "error" | "info";
  onClose?: () => void;
  className?: string;
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-success/10 border-success/20 text-success-foreground",
  warning: "bg-warning/10 border-warning/20 text-warning-foreground",
  error: "bg-destructive/10 border-destructive/20 text-destructive-foreground",
  info: "bg-info/10 border-info/20 text-info-foreground",
};

const variantIcons = {
  default: undefined,
  success: Check,
  warning: AlertTriangle,
  error: X,
  info: Info,
};

export function ActionBar({
  isVisible,
  title,
  description,
  actions,
  selectedCount,
  variant = "default",
  onClose,
  className,
}: ActionBarProps) {
  const VariantIcon = variantIcons[variant];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            duration: 0.3,
          }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-full mx-4",
            className
          )}
        >
          <div
            className={cn(
              "glass-modal shadow-2xl border rounded-2xl p-4",
              variantStyles[variant]
            )}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left Content */}
              <div className="flex items-center gap-3 min-w-0">
                {VariantIcon && (
                  <div className="flex-shrink-0">
                    <VariantIcon className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {title && (
                      <h3 className="font-semibold text-foreground truncate">
                        {title}
                      </h3>
                    )}
                    {selectedCount !== undefined && selectedCount > 0 && (
                      <Badge variant="secondary" size="sm">
                        {selectedCount} selected
                      </Badge>
                    )}
                  </div>
                  {description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {actions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      loading={action.loading}
                      className="flex items-center gap-2"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  );
                })}

                {onClose && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClose}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing action bar state
export function useActionBar() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

  const showActionBar = React.useCallback(() => setIsVisible(true), []);
  const hideActionBar = React.useCallback(() => setIsVisible(false), []);
  const toggleActionBar = React.useCallback(
    () => setIsVisible((prev) => !prev),
    []
  );

  const selectItem = React.useCallback((id: string) => {
    setSelectedItems((prev) => [...prev, id]);
  }, []);

  const deselectItem = React.useCallback((id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item !== id));
  }, []);

  const toggleItem = React.useCallback((id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedItems([]);
    setIsVisible(false);
  }, []);

  const selectAll = React.useCallback((ids: string[]) => {
    setSelectedItems(ids);
    setIsVisible(true);
  }, []);

  React.useEffect(() => {
    if (selectedItems.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedItems.length]);

  return {
    isVisible,
    selectedItems,
    selectedCount: selectedItems.length,
    showActionBar,
    hideActionBar,
    toggleActionBar,
    selectItem,
    deselectItem,
    toggleItem,
    clearSelection,
    selectAll,
  };
}
