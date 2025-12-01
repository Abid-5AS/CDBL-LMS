import { prisma } from "@/lib/prisma";
import { EncashmentStatus, LeaveType } from "@prisma/client";
import { NotificationService } from "./notification.service";

export const ENCASHMENT_POLICY = {
  MIN_BALANCE_TO_KEEP: 10, // Assumption: Must keep 10 days
  MAX_ENCASHMENT_PER_REQUEST: 15, // Assumption: Max 15 days at once
  MIN_SERVICE_YEARS: 1, // Assumption: Must be employed for 1 year
};

export type EncashmentResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class EncashmentService {
  /**
   * Get encashment requests for a user.
   * 
   * @param userId - ID of the user
   * @returns List of encashment requests ordered by creation date (descending)
   */
  static async getUserRequests(userId: number) {
    return prisma.encashmentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get all pending encashment requests (for Admin).
   * 
   * @returns List of pending encashment requests with user details
   */
  static async getPendingRequests() {
    return prisma.encashmentRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            empCode: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Request Earned Leave (EL) encashment.
   * 
   * Validates policy constraints (min balance, max request size) and creates a request.
   * 
   * @param userId - ID of the user requesting encashment
   * @param daysRequested - Number of days to encash
   * @param reason - Optional reason for the request
   * @returns EncashmentResult containing the created request or error details
   */
  static async requestEncashment(
    userId: number,
    daysRequested: number,
    reason?: string
  ): Promise<EncashmentResult<any>> {
    try {
      // 1. Validate policy constraints
      if (daysRequested <= 0) {
        return { success: false, error: "Days requested must be greater than 0" };
      }
      if (daysRequested > ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST) {
        return {
          success: false,
          error: `Cannot request more than ${ENCASHMENT_POLICY.MAX_ENCASHMENT_PER_REQUEST} days at once`,
        };
      }

      // 2. Get current EL balance
      const currentYear = new Date().getFullYear();
      const balance = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId,
            type: LeaveType.EARNED,
            year: currentYear,
          },
        },
      });

      if (!balance) {
        return { success: false, error: "Earned Leave balance not found" };
      }

      // 3. Check if balance is sufficient (considering min balance to keep)
      // Available for encashment = Closing Balance - Min Balance to Keep
      // Note: We use 'closing' as the current available balance
      const availableForEncashment =
        balance.closing - ENCASHMENT_POLICY.MIN_BALANCE_TO_KEEP;

      if (availableForEncashment < daysRequested) {
        return {
          success: false,
          error: `Insufficient balance. You must retain at least ${ENCASHMENT_POLICY.MIN_BALANCE_TO_KEEP} days of Earned Leave. Available for encashment: ${Math.max(0, availableForEncashment)} days.`,
        };
      }

      // 4. Create request
      const request = await prisma.encashmentRequest.create({
        data: {
          userId,
          year: currentYear,
          daysRequested,
          balanceAtRequest: balance.closing,
          reason,
          status: EncashmentStatus.PENDING,
        },
      });

      // 5. Notify HR Admin
      await NotificationService.notifyEncashmentRequested(request.id);

      return { success: true, data: request };
    } catch (error) {
      console.error("EncashmentService.requestEncashment error:", error);
      return { success: false, error: "Failed to submit encashment request" };
    }
  }

  /**
   * Approve an encashment request.
   * 
   * Updates request status to APPROVED and deducts the days from the user's EL balance.
   * This operation is transactional.
   * 
   * @param requestId - ID of the encashment request
   * @param approverId - ID of the HR Admin approving the request
   * @returns EncashmentResult indicating success or failure
   */
  static async approveEncashment(
    requestId: number,
    approverId: number
  ): Promise<EncashmentResult<any>> {
    try {
      const request = await prisma.encashmentRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return { success: false, error: "Request not found" };
      }

      if (request.status !== EncashmentStatus.PENDING) {
        return { success: false, error: "Request is not pending" };
      }

      // Transaction to update request and deduct balance
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update request status
        const updatedRequest = await tx.encashmentRequest.update({
          where: { id: requestId },
          data: {
            status: EncashmentStatus.APPROVED,
            approvedBy: approverId,
            approvedAt: new Date(),
          },
        });

        // 2. Deduct from balance
        // We increment 'used' and decrement 'closing'
        // Note: Encashment is technically 'usage' of leave for cash
        const balance = await tx.balance.update({
          where: {
            userId_type_year: {
              userId: request.userId,
              type: LeaveType.EARNED,
              year: request.year,
            },
          },
          data: {
            used: { increment: request.daysRequested },
            closing: { decrement: request.daysRequested },
          },
        });

        return { request: updatedRequest, balance };
      });

      // 3. Notify Employee
      await NotificationService.notifyEncashmentApproved(requestId);

      return { success: true, data: result };
    } catch (error) {
      console.error("EncashmentService.approveEncashment error:", error);
      return { success: false, error: "Failed to approve request" };
    }
  }

  /**
   * Reject an encashment request.
   * 
   * Updates request status to REJECTED and records the rejection reason.
   * 
   * @param requestId - ID of the encashment request
   * @param approverId - ID of the HR Admin rejecting the request
   * @param reason - Reason for rejection
   * @returns EncashmentResult indicating success or failure
   */
  static async rejectEncashment(
    requestId: number,
    approverId: number,
    reason: string
  ): Promise<EncashmentResult<any>> {
    try {
      const request = await prisma.encashmentRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return { success: false, error: "Request not found" };
      }

      if (request.status !== EncashmentStatus.PENDING) {
        return { success: false, error: "Request is not pending" };
      }

      const updatedRequest = await prisma.encashmentRequest.update({
        where: { id: requestId },
        data: {
          status: EncashmentStatus.REJECTED,
          approvedBy: approverId, // Recorded as the person who rejected
          approvedAt: new Date(), // Recorded as decision time
          rejectionReason: reason,
        },
      });

      // Notify Employee
      await NotificationService.notifyEncashmentRejected(requestId);

      return { success: true, data: updatedRequest };
    } catch (error) {
      console.error("EncashmentService.rejectEncashment error:", error);
      return { success: false, error: "Failed to reject request" };
    }
  }
}
