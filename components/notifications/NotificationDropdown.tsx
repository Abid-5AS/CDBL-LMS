"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox } from "lucide-react";

type Notification = {
  id: string;
  type: "approval" | "rejection" | "pending_review" | "reminder";
  title: string;
  message: string;
  link?: string;
  timestamp: string;
  read: boolean;
};

// Mock notifications - in real app, fetch from API
const fetcher = (url: string) => fetch(url).then((res) => res.json()).catch(() => ({ notifications: [] }));

export function NotificationDropdown() {
  // In a real implementation, fetch actual notifications from API
  const notifications = useMemo<Notification[]>(() => {
    // Mock data for now
    return [];
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" aria-label={`${unreadCount} unread notifications`} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
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
                className={!notification.read ? "bg-blue-50" : ""}
              >
                {notification.link ? (
                  <Link href={notification.link} className="flex flex-col gap-1 w-full p-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-600 rounded-full mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(notification.timestamp)}</p>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-1 w-full p-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-600 rounded-full mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(notification.timestamp)}</p>
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="w-full text-center text-sm text-blue-600">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

