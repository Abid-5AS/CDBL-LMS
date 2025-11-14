/**
 * ErrorToast Component
 *
 * Toast notification component for displaying errors, success, warnings, and info
 * Supports auto-dismiss, custom actions, and smooth animations
 */

"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";

interface ErrorToastProps {
  /** Notification data */
  notification: Notification;

  /** Called when notification is dismissed */
  onDismiss?: (id: string) => void;

  /** Close button always visible (default: false) */
  showCloseButton?: boolean;
}

const typeConfig = {
  error: {
    icon: AlertCircle,
    bgClass: "bg-destructive/10 border-destructive/20",
    textClass: "text-destructive",
    iconClass: "text-destructive",
  },
  success: {
    icon: CheckCircle2,
    bgClass: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
    textClass: "text-emerald-900 dark:text-emerald-100",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
    textClass: "text-yellow-900 dark:text-yellow-100",
    iconClass: "text-yellow-600 dark:text-yellow-400",
  },
  info: {
    icon: Info,
    bgClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
    textClass: "text-blue-900 dark:text-blue-100",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
};

/**
 * ErrorToast - Toast notification component
 *
 * Displays notifications with type-specific styling and optional actions.
 * Auto-dismisses based on notification duration.
 *
 * @example
 * ```tsx
 * const { notifications, dismiss } = useNotification();
 *
 * return (
 *   <div className="space-y-2 fixed top-4 right-4">
 *     {notifications.map(notification => (
 *       <ErrorToast
 *         key={notification.id}
 *         notification={notification}
 *         onDismiss={dismiss}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function ErrorToast({
  notification,
  onDismiss,
  showCloseButton = true,
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  useEffect(() => {
    if (!notification.duration || notification.duration <= 0) {
      return; // Don't auto-dismiss
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onDismiss?.(notification.id);
      }, 150); // Wait for fade animation
    }, notification.duration);

    return () => clearTimeout(timer);
  }, [notification.duration, notification.id, onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "animate-in slide-in-from-right-full fade-in-0 duration-200",
        "rounded-lg border p-4",
        config.bgClass
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconClass)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-sm", config.textClass)}>
            {notification.message}
          </p>

          {notification.description && (
            <p className={cn("text-xs mt-1 opacity-75", config.textClass)}>
              {notification.description}
            </p>
          )}

          {/* Action button */}
          {notification.action && (
            <Button
              onClick={() => {
                notification.action?.onClick();
                setIsVisible(false);
                setTimeout(() => {
                  onDismiss?.(notification.id);
                }, 150);
              }}
              variant="ghost"
              size="sm"
              className={cn("mt-2 h-7 text-xs", config.textClass)}
            >
              {notification.action.label}
            </Button>
          )}
        </div>

        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                onDismiss?.(notification.id);
              }, 150);
            }}
            className={cn(
              "ml-2 flex-shrink-0 rounded hover:bg-black/5 dark:hover:bg-white/5",
              "p-1 transition-colors"
            )}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
