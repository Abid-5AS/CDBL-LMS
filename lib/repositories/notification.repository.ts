import { prisma } from "@/lib/prisma";
import { Prisma } from "@/src/generated/prisma/client";
import { notificationEvents, NOTIFICATION_EVENT } from "@/lib/events";

// Type for notification with all relations
export type NotificationWithRelations = Prisma.NotificationGetPayload<{}>;

// Type for creating notifications
export type CreateNotificationData = {
  userId: number;
  type: string; // NotificationType enum value
  title: string;
  message: string;
  link?: string;
  leaveId?: number;
  expiresAt?: Date;
};

/**
 * NotificationRepository
 *
 * Handles all database operations for notifications.
 * Provides clean data access layer for the notification system.
 */
export class NotificationRepository {
  /**
   * Find notification by ID
   */
  static async findById(id: number): Promise<NotificationWithRelations | null> {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  /**
   * Find all notifications for a specific user
   */
  static async findByUserId(
    userId: number,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<NotificationWithRelations[]> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options?.unreadOnly ? { read: false } : {}),
    };

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      skip: options?.offset,
    });
  }

  /**
   * Find recent notifications for a user (last 30 days)
   */
  static async findRecent(userId: number, limit: number = 20): Promise<NotificationWithRelations[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Count unread notifications for a user
   */
  static async countUnread(userId: number): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }



  /**
   * Create a new notification
   */
  static async create(data: CreateNotificationData): Promise<NotificationWithRelations> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        link: data.link,
        leaveId: data.leaveId,
        expiresAt: data.expiresAt,
      },
    });

    // Emit event
    notificationEvents.emit(NOTIFICATION_EVENT, notification);

    return notification;
  }

  /**
   * Create multiple notifications (bulk)
   */
  static async createMany(notifications: CreateNotificationData[]): Promise<number> {
    // We can't easily get the created IDs with createMany in MySQL/Prisma
    // So we'll iterate and create individually if we want to emit events for each
    // OR we just emit events without IDs (client might need ID for key, but maybe okay)
    // For real-time, it's better to have the full object.
    // Given the scale (usually small batches), creating individually in a transaction is acceptable for now
    // or we can just fire-and-forget the events based on input data (but missing ID)
    
    // Strategy: Create individually to get full objects and emit events
    // This is slightly slower but ensures correctness for real-time
    
    const createdNotifications: NotificationWithRelations[] = [];
    
    await prisma.$transaction(async (tx) => {
      for (const n of notifications) {
        const notification = await tx.notification.create({
          data: {
            userId: n.userId,
            type: n.type as any,
            title: n.title,
            message: n.message,
            link: n.link,
            leaveId: n.leaveId,
            expiresAt: n.expiresAt,
          },
        });
        createdNotifications.push(notification as any);
      }
    });

    // Emit events after transaction commits
    createdNotifications.forEach(n => {
      notificationEvents.emit(NOTIFICATION_EVENT, n);
    });

    return createdNotifications.length;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: number): Promise<NotificationWithRelations> {
    return prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete notification by ID
   */
  static async delete(id: number): Promise<NotificationWithRelations> {
    return prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Delete all read notifications older than X days
   */
  static async deleteOldRead(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notification.deleteMany({
      where: {
        read: true,
        readAt: { lte: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Delete expired notifications
   */
  static async deleteExpired(): Promise<number> {
    const now = new Date();

    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: { lte: now },
      },
    });

    return result.count;
  }

  /**
   * Find notifications by leave ID
   */
  static async findByLeaveId(leaveId: number): Promise<NotificationWithRelations[]> {
    return prisma.notification.findMany({
      where: { leaveId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get notification statistics for a user
   */
  static async getUserStats(userId: number): Promise<{
    total: number;
    unread: number;
    read: number;
  }> {
    const [total, unread] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      total,
      unread,
      read: total - unread,
    };
  }
}
