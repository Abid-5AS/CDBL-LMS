"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/lib/contexts/notification-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type FilterType = "all" | "unread" | "approval" | "leave" | "fitness";

export function NotificationsList() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    reconnect,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    if (filter === "approval")
      return (
        notification.type === "APPROVAL_REQUIRED" ||
        notification.type === "FITNESS_CERTIFICATE_REVIEW_REQUIRED"
      );
    if (filter === "leave")
      return (
        notification.type === "LEAVE_SUBMITTED" ||
        notification.type === "LEAVE_APPROVED" ||
        notification.type === "LEAVE_REJECTED" ||
        notification.type === "LEAVE_RETURNED" ||
        notification.type === "LEAVE_FORWARDED" ||
        notification.type === "LEAVE_CANCELLED"
      );
    if (filter === "fitness")
      return (
        notification.type === "FITNESS_CERTIFICATE_REQUIRED" ||
        notification.type === "FITNESS_CERTIFICATE_UPLOADED" ||
        notification.type === "FITNESS_CERTIFICATE_APPROVED" ||
        notification.type === "FITNESS_CERTIFICATE_REJECTED"
      );
    return true;
  });

  // Get notification variant
  const getNotificationVariant = (type: string) => {
    if (type.includes("APPROVED")) return "success";
    if (type.includes("REJECTED")) return "destructive";
    if (type.includes("REQUIRED")) return "default";
    return "secondary";
  };

  const getNotificationColor = (type: string) => {
    if (type.includes("APPROVED")) return "text-green-600 dark:text-green-400";
    if (type.includes("REJECTED")) return "text-red-600 dark:text-red-400";
    if (type.includes("REQUIRED")) return "text-blue-600 dark:text-blue-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredNotifications.length} notifications
          </Badge>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
          {!isConnected && (
            <Badge variant="destructive" className="text-sm">
              Offline
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isConnected && (
            <Button variant="outline" size="sm" onClick={reconnect}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approval">Approvals</TabsTrigger>
          <TabsTrigger value="leave">Leaves</TabsTrigger>
          <TabsTrigger value="fitness">Fitness</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                {filter === "all"
                  ? "No notifications yet"
                  : `No ${filter} notifications`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  "transition-all hover:shadow-md",
                  !notification.read &&
                    "border-l-4 border-l-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle
                          className={cn(
                            "text-lg",
                            getNotificationColor(notification.type)
                          )}
                        >
                          {notification.title}
                        </CardTitle>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {format(new Date(notification.createdAt), "PPp")} •{" "}
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-foreground mb-4">
                    {notification.message}
                  </p>

                  {notification.link && (
                    <Link href={notification.link}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        View Details
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Load more placeholder (for future pagination) */}
      {filteredNotifications.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredNotifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
}
