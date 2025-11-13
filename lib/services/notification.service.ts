import {
  NotificationRepository,
  CreateNotificationData,
  NotificationWithRelations,
} from "@/lib/repositories/notification.repository";
import { LeaveType, LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};

/**
 * NotificationService
 *
 * Handles all notification business logic including:
 * - Creating notifications for leave workflow events
 * - Managing notification delivery
 * - Notification preferences
 * - Cleanup of old notifications
 */
export class NotificationService {
  /**
   * Get notifications for a user
   */
  static async getForUser(
    userId: number,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<ServiceResult<NotificationWithRelations[]>> {
    try {
      const notifications = await NotificationRepository.findByUserId(userId, options);
      return { success: true, data: notifications };
    } catch (error) {
      console.error("NotificationService.getForUser error:", error);
      return {
        success: false,
        error: {
          code: "fetch_error",
          message: "Failed to fetch notifications",
        },
      };
    }
  }

  /**
   * Get recent notifications (last 30 days)
   */
  static async getRecent(userId: number, limit: number = 20): Promise<ServiceResult<NotificationWithRelations[]>> {
    try {
      const notifications = await NotificationRepository.findRecent(userId, limit);
      return { success: true, data: notifications };
    } catch (error) {
      console.error("NotificationService.getRecent error:", error);
      return {
        success: false,
        error: {
          code: "fetch_error",
          message: "Failed to fetch recent notifications",
        },
      };
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: number): Promise<ServiceResult<number>> {
    try {
      const count = await NotificationRepository.countUnread(userId);
      return { success: true, data: count };
    } catch (error) {
      console.error("NotificationService.getUnreadCount error:", error);
      return {
        success: false,
        error: {
          code: "count_error",
          message: "Failed to count unread notifications",
        },
      };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: number, userId: number): Promise<ServiceResult<NotificationWithRelations>> {
    try {
      // Verify notification belongs to user
      const notification = await NotificationRepository.findById(notificationId);
      if (!notification) {
        return {
          success: false,
          error: {
            code: "not_found",
            message: "Notification not found",
          },
        };
      }

      if (notification.userId !== userId) {
        return {
          success: false,
          error: {
            code: "unauthorized",
            message: "You cannot access this notification",
          },
        };
      }

      const updated = await NotificationRepository.markAsRead(notificationId);
      return { success: true, data: updated };
    } catch (error) {
      console.error("NotificationService.markAsRead error:", error);
      return {
        success: false,
        error: {
          code: "update_error",
          message: "Failed to mark notification as read",
        },
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number): Promise<ServiceResult<number>> {
    try {
      const count = await NotificationRepository.markAllAsRead(userId);
      return { success: true, data: count };
    } catch (error) {
      console.error("NotificationService.markAllAsRead error:", error);
      return {
        success: false,
        error: {
          code: "update_error",
          message: "Failed to mark all notifications as read",
        },
      };
    }
  }

  /**
   * Delete a notification
   */
  static async delete(notificationId: number, userId: number): Promise<ServiceResult<void>> {
    try {
      // Verify notification belongs to user
      const notification = await NotificationRepository.findById(notificationId);
      if (!notification) {
        return {
          success: false,
          error: {
            code: "not_found",
            message: "Notification not found",
          },
        };
      }

      if (notification.userId !== userId) {
        return {
          success: false,
          error: {
            code: "unauthorized",
            message: "You cannot delete this notification",
          },
        };
      }

      await NotificationRepository.delete(notificationId);
      return { success: true };
    } catch (error) {
      console.error("NotificationService.delete error:", error);
      return {
        success: false,
        error: {
          code: "delete_error",
          message: "Failed to delete notification",
        },
      };
    }
  }

  /**
   * Create notification when leave is submitted
   */
  static async notifyLeaveSubmitted(leaveId: number, requesterId: number): Promise<ServiceResult<number>> {
    try {
      // Get leave request details
      const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: {
          requester: { select: { name: true, email: true } },
          approvals: {
            where: { decision: "PENDING" },
            include: { approver: { select: { id: true } } },
          },
        },
      });

      if (!leave) {
        return {
          success: false,
          error: { code: "leave_not_found", message: "Leave request not found" },
        };
      }

      // Create notifications for all pending approvers
      const notifications: CreateNotificationData[] = leave.approvals.map((approval) => ({
        userId: approval.approver.id,
        type: "APPROVAL_REQUIRED",
        title: "New Leave Approval Required",
        message: `${leave.requester.name} has submitted a ${leave.type} leave request`,
        link: `/leaves/${leaveId}`,
        leaveId: leaveId,
      }));

      // Also notify the requester that their leave was submitted
      notifications.push({
        userId: requesterId,
        type: "LEAVE_SUBMITTED",
        title: "Leave Request Submitted",
        message: `Your ${leave.type} leave request has been submitted for approval`,
        link: `/leaves/${leaveId}`,
        leaveId: leaveId,
      });

      const count = await NotificationRepository.createMany(notifications);
      return { success: true, data: count };
    } catch (error) {
      console.error("NotificationService.notifyLeaveSubmitted error:", error);
      return {
        success: false,
        error: {
          code: "notification_error",
          message: "Failed to send notifications",
        },
      };
    }
  }

  /**
   * Create notification when leave is approved
   */
  static async notifyLeaveApproved(leaveId: number, approverName: string): Promise<ServiceResult<void>> {
    try {
      const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: { requester: { select: { id: true, name: true } } },
      });

      if (!leave) {
        return {
          success: false,
          error: { code: "leave_not_found", message: "Leave request not found" },
        };
      }

      await NotificationRepository.create({
        userId: leave.requesterId,
        type: "LEAVE_APPROVED",
        title: "Leave Request Approved",
        message: `Your ${leave.type} leave request has been approved by ${approverName}`,
        link: `/leaves/${leaveId}`,
        leaveId: leaveId,
      });

      return { success: true };
    } catch (error) {
      console.error("NotificationService.notifyLeaveApproved error:", error);
      return {
        success: false,
        error: {
          code: "notification_error",
          message: "Failed to send approval notification",
        },
      };
    }
  }

  /**
   * Create notification when leave is rejected
   */
  static async notifyLeaveRejected(leaveId: number, approverName: string, reason?: string): Promise<ServiceResult<void>> {
    try {
      const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: { requester: { select: { id: true, name: true } } },
      });

      if (!leave) {
        return {
          success: false,
          error: { code: "leave_not_found", message: "Leave request not found" },
        };
      }

      const message = reason
        ? `Your ${leave.type} leave request has been rejected by ${approverName}. Reason: ${reason}`
        : `Your ${leave.type} leave request has been rejected by ${approverName}`;

      await NotificationRepository.create({
        userId: leave.requesterId,
        type: "LEAVE_REJECTED",
        title: "Leave Request Rejected",
        message,
        link: `/leaves/${leaveId}`,
        leaveId: leaveId,
      });

      return { success: true };
    } catch (error) {
      console.error("NotificationService.notifyLeaveRejected error:", error);
      return {
        success: false,
        error: {
          code: "notification_error",
          message: "Failed to send rejection notification",
        },
      };
    }
  }

  /**
   * Create notification when leave is returned for modification
   */
  static async notifyLeaveReturned(leaveId: number, approverName: string, comment: string): Promise<ServiceResult<void>> {
    try {
      const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: { requester: { select: { id: true, name: true } } },
      });

      if (!leave) {
        return {
          success: false,
          error: { code: "leave_not_found", message: "Leave request not found" },
        };
      }

      await NotificationRepository.create({
        userId: leave.requesterId,
        type: "LEAVE_RETURNED",
        title: "Leave Request Returned",
        message: `Your ${leave.type} leave request has been returned by ${approverName}. ${comment}`,
        link: `/leaves/${leaveId}`,
        leaveId: leaveId,
      });

      return { success: true };
    } catch (error) {
      console.error("NotificationService.notifyLeaveReturned error:", error);
      return {
        success: false,
        error: {
          code: "notification_error",
          message: "Failed to send return notification",
        },
      };
    }
  }

  /**
   * Create notification when leave is forwarded
   */
  static async notifyLeaveForwarded(leaveId: number, newApproverId: number, forwarderName: string): Promise<ServiceResult<void>> {
    try {
      const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: { requester: { select: { name: true } } },
      });

      if (!leave) {
        return {
          success: false,
          error: { code: "leave_not_found", message: "Leave request not found" },
        };
      }

      // Notify new approver
      await NotificationRepository.create({
        userId: newApproverId,
        type: "APPROVAL_REQUIRED",
        title: "Leave Approval Forwarded to You",
        message: `${forwarderName} has forwarded ${leave.requester.name}'s ${leave.type} leave request for your approval`,
        link: `/leaves/${leaveId}`,
        leaveId: leaveId,
      });

      // Notify requester
      await NotificationRepository.create({
        userId: leave.requesterId,
        type: "LEAVE_FORWARDED",
        title: "Leave Request Forwarded",
        message: `Your ${leave.type} leave request has been forwarded by ${forwarderName} for further approval`,
        link: `/leaves/${leaveId}`,
        leaveId: leaveId,
      });

      return { success: true };
    } catch (error) {
      console.error("NotificationService.notifyLeaveForwarded error:", error);
      return {
        success: false,
        error: {
          code: "notification_error",
          message: "Failed to send forward notification",
        },
      };
    }
  }

  /**
   * Create notification when leave is cancelled
   */
  static async notifyLeaveCancelled(leaveId: number): Promise<ServiceResult<void>> {
    try {
      const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: {
          requester: { select: { id: true, name: true } },
          approvals: { include: { approver: { select: { id: true } } } },
        },
      });

      if (!leave) {
        return {
          success: false,
          error: { code: "leave_not_found", message: "Leave request not found" },
        };
      }

      // Notify all approvers
      const approverIds = [...new Set(leave.approvals.map((a) => a.approver.id))];
      const notifications: CreateNotificationData[] = approverIds.map((approverId) => ({
        userId: approverId,
        type: "LEAVE_CANCELLED",
        title: "Leave Request Cancelled",
        message: `${leave.requester.name} has cancelled their ${leave.type} leave request`,
        link: `/leaves/${leaveId}`,
        leaveId: leaveId,
      }));

      await NotificationRepository.createMany(notifications);
      return { success: true };
    } catch (error) {
      console.error("NotificationService.notifyLeaveCancelled error:", error);
      return {
        success: false,
        error: {
          code: "notification_error",
          message: "Failed to send cancellation notification",
        },
      };
    }
  }

  /**
   * Cleanup old notifications (maintenance task)
   */
  static async cleanup(daysOld: number = 30): Promise<ServiceResult<{ readDeleted: number; expiredDeleted: number }>> {
    try {
      const [readDeleted, expiredDeleted] = await Promise.all([
        NotificationRepository.deleteOldRead(daysOld),
        NotificationRepository.deleteExpired(),
      ]);

      return {
        success: true,
        data: { readDeleted, expiredDeleted },
      };
    } catch (error) {
      console.error("NotificationService.cleanup error:", error);
      return {
        success: false,
        error: {
          code: "cleanup_error",
          message: "Failed to cleanup notifications",
        },
      };
    }
  }
}
