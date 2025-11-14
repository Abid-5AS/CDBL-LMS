/**
 * Notification Utilities
 *
 * Helpers for managing notification queue and lifecycle
 */

export interface Notification {
  /** Unique identifier */
  id: string;

  /** Notification type */
  type: "error" | "success" | "warning" | "info";

  /** Message to display */
  message: string;

  /** Optional description */
  description?: string;

  /** Duration in ms (0 = manual dismiss) */
  duration?: number;

  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };

  /** Timestamp when notification was created */
  createdAt: Date;
}

/**
 * Generate unique notification ID
 * @returns Unique ID string
 */
export function generateNotificationId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a notification object
 * @param type - Notification type
 * @param message - Message to display
 * @param options - Additional options
 * @returns Notification object
 */
export function createNotification(
  type: Notification["type"],
  message: string,
  options?: {
    description?: string;
    duration?: number;
    action?: Notification["action"];
  }
): Notification {
  return {
    id: generateNotificationId(),
    type,
    message,
    description: options?.description,
    duration: options?.duration ?? (type === "error" ? 5000 : 3000),
    action: options?.action,
    createdAt: new Date(),
  };
}

/**
 * Create an error notification with sensible defaults
 * @param message - Error message
 * @param options - Additional options
 * @returns Error notification
 */
export function createErrorNotification(
  message: string,
  options?: {
    description?: string;
    duration?: number;
    action?: Notification["action"];
  }
): Notification {
  return createNotification("error", message, {
    duration: 5000, // Errors stay longer
    ...options,
  });
}

/**
 * Create a success notification with sensible defaults
 * @param message - Success message
 * @param options - Additional options
 * @returns Success notification
 */
export function createSuccessNotification(
  message: string,
  options?: {
    description?: string;
    duration?: number;
  }
): Notification {
  return createNotification("success", message, {
    duration: 3000,
    ...options,
  });
}

/**
 * Create a warning notification with sensible defaults
 * @param message - Warning message
 * @param options - Additional options
 * @returns Warning notification
 */
export function createWarningNotification(
  message: string,
  options?: {
    description?: string;
    duration?: number;
  }
): Notification {
  return createNotification("warning", message, {
    duration: 4000,
    ...options,
  });
}

/**
 * Create an info notification with sensible defaults
 * @param message - Info message
 * @param options - Additional options
 * @returns Info notification
 */
export function createInfoNotification(
  message: string,
  options?: {
    description?: string;
    duration?: number;
  }
): Notification {
  return createNotification("info", message, {
    duration: 3000,
    ...options,
  });
}

/**
 * Notification manager for handling queue and lifecycle
 * Used internally by NotificationContext
 */
export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private maxNotifications: number = 3;
  private listeners: Set<() => void> = new Set();

  /**
   * Add a notification to the queue
   * @param notification - Notification to add
   * @param onDismiss - Callback when notification is dismissed
   */
  add(notification: Notification, onDismiss?: (id: string) => void): string {
    const { id, duration } = notification;

    // Add notification
    this.notifications.set(id, notification);

    // Set auto-dismiss timer if duration specified
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        this.remove(id);
        onDismiss?.(id);
      }, duration);

      this.timers.set(id, timer);
    }

    // Notify listeners
    this.notifyListeners();

    return id;
  }

  /**
   * Remove a notification from the queue
   * @param id - Notification ID
   */
  remove(id: string): void {
    // Clear timer
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    // Remove notification
    this.notifications.delete(id);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get all notifications, limited by maxNotifications
   * @returns Array of notifications
   */
  getNotifications(): Notification[] {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, this.maxNotifications);

    return notifications;
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all notifications
    this.notifications.clear();

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Subscribe to notification changes
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Get size of notification queue
   */
  get size(): number {
    return this.notifications.size;
  }

  /**
   * Set maximum number of visible notifications
   */
  setMaxNotifications(max: number): void {
    this.maxNotifications = Math.max(1, max);
    this.notifyListeners();
  }
}
