"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { toast } from "sonner";

export type NotificationType =
  | "APPROVAL_REQUIRED"
  | "LEAVE_SUBMITTED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_RETURNED"
  | "LEAVE_FORWARDED"
  | "LEAVE_CANCELLED"
  | "FITNESS_CERTIFICATE_REQUIRED"
  | "FITNESS_CERTIFICATE_UPLOADED"
  | "FITNESS_CERTIFICATE_APPROVED"
  | "FITNESS_CERTIFICATE_REJECTED"
  | "FITNESS_CERTIFICATE_REVIEW_REQUIRED"
  | "SYSTEM";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  leaveId?: number | null;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  reconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  // Function to connect to SSE
  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log("[NotificationProvider] Connecting to SSE...");
    const eventSource = new EventSource("/api/notifications/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[NotificationProvider] SSE connection opened");
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset reconnection attempts
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("[NotificationProvider] Connection acknowledged");
          return;
        }

        if (data.type === "notification") {
          // New notification received
          const newNotification: Notification = data.data;
          console.log("[NotificationProvider] New notification:", newNotification);

          // Add to notifications list (prepend)
          setNotifications((prev) => [newNotification, ...prev]);

          // Show toast notification
          showToast(newNotification);
        }

        if (data.type === "unread_count") {
          // Unread count update
          console.log("[NotificationProvider] Unread count:", data.count);
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("[NotificationProvider] Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[NotificationProvider] SSE error:", error);
      setIsConnected(false);
      eventSource.close();

      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(
          `[NotificationProvider] Reconnecting in ${delay}ms (attempt ${
            reconnectAttempts.current + 1
          }/${maxReconnectAttempts})...`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, delay);
      } else {
        console.error(
          "[NotificationProvider] Max reconnection attempts reached. Please refresh the page."
        );
      }
    };
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Function to show toast based on notification type
  const showToast = (notification: Notification) => {
    const toastOptions = {
      duration: 5000,
      action: notification.link
        ? {
            label: "View",
            onClick: () => {
              window.location.href = notification.link!;
            },
          }
        : undefined,
    };

    switch (notification.type) {
      case "LEAVE_APPROVED":
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions,
        });
        break;
      case "LEAVE_REJECTED":
      case "FITNESS_CERTIFICATE_REJECTED":
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions,
        });
        break;
      case "APPROVAL_REQUIRED":
      case "FITNESS_CERTIFICATE_REVIEW_REQUIRED":
        toast.info(notification.title, {
          description: notification.message,
          ...toastOptions,
        });
        break;
      default:
        toast(notification.title, {
          description: notification.message,
          ...toastOptions,
        });
    }
  };

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setUnreadCount((prev) => {
          const notification = notifications.find((n) => n.id === notificationId);
          return notification && !notification.read ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, [notifications]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        reconnect,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
