"use client";

import { Bell, Inbox } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";

// UI Components (barrel export)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Badge,
} from "@/components/ui";

import { EmptyState } from "@/components/shared";

// Lib utilities
import { formatDate } from "@/lib";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  createdAt: string;
  read: boolean;
};

// API fetcher
const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((data) => data.notifications || [])
    .catch(() => []);

export function NotificationDropdown() {
  // Fetch notifications from API
  const { data: notifications = [], mutate } = useSWR<Notification[]>(
    "/api/notifications/latest",
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      // Optimistically update local data
      mutate(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        false
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      // Optimistically update local data
      mutate(
        notifications.map((n) => ({ ...n, read: true })),
        false
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/60 rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 bg-transparent border-0"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px] transition-transform duration-300" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                aria-label={`${unreadCount} unread notifications`}
              />
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[500px] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Inbox}
              title="No notifications"
              description="You're all caught up! Notifications will appear here when there are updates to your leave requests."
            />
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                asChild
                className={!notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                onClick={() => {
                  if (!notification.read) {
                    handleMarkAsRead(notification.id);
                  }
                }}
              >
                {notification.link ? (
                  <Link
                    href={notification.link}
                    className="flex flex-col gap-1 w-full p-2"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-1 w-full p-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="w-full text-center text-sm text-blue-600 dark:text-blue-400"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
