import { prisma } from "@/lib/prisma";
import { EncashmentStatus } from "@prisma/client";

export type PaymentStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";
export type PaymentMethod = "BANK_TRANSFER" | "CHEQUE" | "CASH";

export interface PaymentProcessingResult {
  success: boolean;
  data?: {
    encashmentId: number;
    paymentStatus: PaymentStatus;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * EncashmentPaymentService
 *
 * Handles payment processing for approved encashment requests
 */
export class EncashmentPaymentService {
  /**
   * Mark encashment payment as processing
   */
  static async markPaymentProcessing(
    encashmentId: number,
    paymentMethod: PaymentMethod,
    paymentReference: string,
    processedById: number
  ): Promise<PaymentProcessingResult> {
    try {
      // Verify encashment exists and is approved
      const encashment = await prisma.encashmentRequest.findUnique({
        where: { id: encashmentId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!encashment) {
        return {
          success: false,
          error: {
            code: "not_found",
            message: "Encashment request not found",
          },
        };
      }

      if (encashment.status !== EncashmentStatus.APPROVED) {
        return {
          success: false,
          error: {
            code: "invalid_status",
            message: "Only approved encashment requests can be processed for payment",
          },
        };
      }

      // Update encashment with payment processing info
      const updated = await prisma.encashmentRequest.update({
        where: { id: encashmentId },
        data: {
          paymentStatus: "PROCESSING",
          paymentMethod,
          paymentReference,
          processedBy: processedById,
          updatedAt: new Date(),
        },
      });

      // Create notification for employee
      await prisma.notification.create({
        data: {
          userId: encashment.userId,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Encashment Payment Processing",
          message: `Your encashment payment is being processed via ${paymentMethod}. Reference: ${paymentReference}`,
          link: `/encashment/${encashmentId}`,
        },
      });

      return {
        success: true,
        data: {
          encashmentId: updated.id,
          paymentStatus: "PROCESSING",
        },
      };
    } catch (error) {
      console.error(
        "[EncashmentPaymentService] Error marking payment as processing:",
        error
      );
      return {
        success: false,
        error: {
          code: "processing_error",
          message: "Failed to mark payment as processing",
        },
      };
    }
  }

  /**
   * Mark encashment payment as completed
   */
  static async markPaymentComplete(
    encashmentId: number,
    paymentDate: Date,
    paymentReceiptUrl: string | null,
    processedById: number
  ): Promise<PaymentProcessingResult> {
    try {
      // Verify encashment exists
      const encashment = await prisma.encashmentRequest.findUnique({
        where: { id: encashmentId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!encashment) {
        return {
          success: false,
          error: {
            code: "not_found",
            message: "Encashment request not found",
          },
        };
      }

      if (encashment.status !== EncashmentStatus.APPROVED) {
        return {
          success: false,
          error: {
            code: "invalid_status",
            message: "Only approved encashment requests can be marked as paid",
          },
        };
      }

      // Update encashment with payment completion info
      const updated = await prisma.encashmentRequest.update({
        where: { id: encashmentId },
        data: {
          paymentStatus: "PAID",
          paymentDate,
          paymentReceiptUrl,
          paidAt: paymentDate,
          processedBy: processedById,
          status: EncashmentStatus.PAID,
          updatedAt: new Date(),
        },
      });

      // Create notification for employee
      await prisma.notification.create({
        data: {
          userId: encashment.userId,
          type: "ENCASHMENT_APPROVED",
          title: "Encashment Payment Completed",
          message: `Your encashment payment of ${encashment.daysRequested} days has been processed and completed.${
            paymentReceiptUrl ? " Receipt available." : ""
          }`,
          link: `/encashment/${encashmentId}`,
        },
      });

      return {
        success: true,
        data: {
          encashmentId: updated.id,
          paymentStatus: "PAID",
        },
      };
    } catch (error) {
      console.error(
        "[EncashmentPaymentService] Error marking payment as complete:",
        error
      );
      return {
        success: false,
        error: {
          code: "completion_error",
          message: "Failed to mark payment as complete",
        },
      };
    }
  }

  /**
   * Mark encashment payment as failed
   */
  static async markPaymentFailed(
    encashmentId: number,
    failureReason: string,
    processedById: number
  ): Promise<PaymentProcessingResult> {
    try {
      const encashment = await prisma.encashmentRequest.findUnique({
        where: { id: encashmentId },
        include: {
          user: {
            select: { id: true },
          },
        },
      });

      if (!encashment) {
        return {
          success: false,
          error: {
            code: "not_found",
            message: "Encashment request not found",
          },
        };
      }

      // Update encashment
      const updated = await prisma.encashmentRequest.update({
        where: { id: encashmentId },
        data: {
          paymentStatus: "FAILED",
          processedBy: processedById,
          updatedAt: new Date(),
        },
      });

      // Create notification for employee
      await prisma.notification.create({
        data: {
          userId: encashment.userId,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Encashment Payment Failed",
          message: `Your encashment payment processing has failed. Reason: ${failureReason}. Please contact HR.`,
          link: `/encashment/${encashmentId}`,
        },
      });

      return {
        success: true,
        data: {
          encashmentId: updated.id,
          paymentStatus: "FAILED",
        },
      };
    } catch (error) {
      console.error(
        "[EncashmentPaymentService] Error marking payment as failed:",
        error
      );
      return {
        success: false,
        error: {
          code: "failure_error",
          message: "Failed to mark payment as failed",
        },
      };
    }
  }

  /**
   * Get payment status for an encashment request
   */
  static async getPaymentStatus(encashmentId: number) {
    try {
      const encashment = await prisma.encashmentRequest.findUnique({
        where: { id: encashmentId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          paymentReference: true,
          paymentDate: true,
          paymentReceiptUrl: true,
          paidAt: true,
          processedBy: true,
          processor: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return encashment;
    } catch (error) {
      console.error(
        "[EncashmentPaymentService] Error getting payment status:",
        error
      );
      return null;
    }
  }

  /**
   * Get all pending payments (approved but not yet paid)
   */
  static async getPendingPayments() {
    try {
      const pendingPayments = await prisma.encashmentRequest.findMany({
        where: {
          status: EncashmentStatus.APPROVED,
          OR: [
            { paymentStatus: null },
            { paymentStatus: "PENDING" },
            { paymentStatus: "PROCESSING" },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              empCode: true,
              department: true,
            },
          },
          approver: {
            select: {
              name: true,
            },
          },
          processor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          approvedAt: "asc", // Oldest first
        },
      });

      return pendingPayments;
    } catch (error) {
      console.error(
        "[EncashmentPaymentService] Error getting pending payments:",
        error
      );
      return [];
    }
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(year?: number) {
    try {
      const whereClause: any = {
        status: EncashmentStatus.APPROVED,
      };

      if (year) {
        whereClause.year = year;
      }

      const [
        total,
        paid,
        processing,
        pending,
        failed,
        totalDaysPaid,
      ] = await Promise.all([
        prisma.encashmentRequest.count({
          where: whereClause,
        }),
        prisma.encashmentRequest.count({
          where: {
            ...whereClause,
            paymentStatus: "PAID",
          },
        }),
        prisma.encashmentRequest.count({
          where: {
            ...whereClause,
            paymentStatus: "PROCESSING",
          },
        }),
        prisma.encashmentRequest.count({
          where: {
            ...whereClause,
            OR: [
              { paymentStatus: null },
              { paymentStatus: "PENDING" },
            ],
          },
        }),
        prisma.encashmentRequest.count({
          where: {
            ...whereClause,
            paymentStatus: "FAILED",
          },
        }),
        prisma.encashmentRequest.aggregate({
          where: {
            ...whereClause,
            paymentStatus: "PAID",
          },
          _sum: {
            daysRequested: true,
          },
        }),
      ]);

      return {
        total,
        paid,
        processing,
        pending,
        failed,
        totalDaysPaid: totalDaysPaid._sum.daysRequested || 0,
      };
    } catch (error) {
      console.error(
        "[EncashmentPaymentService] Error getting payment stats:",
        error
      );
      return {
        total: 0,
        paid: 0,
        processing: 0,
        pending: 0,
        failed: 0,
        totalDaysPaid: 0,
      };
    }
  }
}
