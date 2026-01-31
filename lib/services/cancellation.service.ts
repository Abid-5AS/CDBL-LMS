/**
 * Cancellation Service
 * Handles leave cancellation request workflow
 */

import { LeaveType, LeaveStatus, ApprovalDecision } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "./notification.service";

export type CreateCancellationDTO = {
    reason: string;
    newStartDate?: Date;  // For partial cancellation
    newEndDate?: Date;    // For partial cancellation
};

export type ServiceResult<T> = {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
};

export class CancellationService {
    /**
     * Create a cancellation request for an approved leave.
     * 
     * The cancellation follows the same approval chain as the original leave,
     * but only includes approvers who already approved it.
     */
    static async createCancellationRequest(
        userId: number,
        leaveId: number,
        dto: CreateCancellationDTO
    ): Promise<ServiceResult<any>> {
        try {
            // 1. Validate the original leave exists and can be cancelled
            const validation = await this.validateCancellationRequest(userId, leaveId, dto);
            if (!validation.success) {
                return validation;
            }

            const originalLeave = validation.data!.originalLeave;
            const approvedSteps = validation.data!.approvedSteps;
            const isPartial = !!(dto.newStartDate || dto.newEndDate);

            // 2. Calculate working days for cancellation
            const newStartDate = dto.newStartDate || originalLeave.startDate;
            const newEndDate = dto.newEndDate || originalLeave.endDate;

            // For full cancellation, days to cancel = all working days
            // For partial, days to cancel = difference
            let daysToCancel = originalLeave.workingDays;
            if (isPartial) {
                // Calculate new working days (simplified - you may need proper calculation)
                const diffTime = Math.abs(newEndDate.getTime() - newStartDate.getTime());
                const newWorkingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                daysToCancel = originalLeave.workingDays - newWorkingDays;
            }

            // 3. Create cancellation request with scoped approval chain
            const cancellationRequest = await prisma.$transaction(async (tx) => {
                // Create the cancellation request
                const cancellation = await tx.leaveRequest.create({
                    data: {
                        requesterId: userId,
                        type: originalLeave.type,
                        startDate: isPartial ? newStartDate : originalLeave.startDate,
                        endDate: isPartial ? newEndDate : originalLeave.endDate,
                        workingDays: daysToCancel,
                        reason: `Cancellation Request: ${dto.reason}`,
                        status: LeaveStatus.SUBMITTED,
                        policyVersion: originalLeave.policyVersion,
                        isCancellationRequest: true,
                        isPartialCancellation: isPartial,
                        parentLeaveId: leaveId,
                        cancellationReason: dto.reason,
                        originalEndDate: isPartial ? originalLeave.endDate : null,
                    },
                });

                // Create approval chain - only from approvers who approved the original
                for (const approval of approvedSteps) {
                    await tx.approval.create({
                        data: {
                            leaveId: cancellation.id,
                            step: approval.step,
                            approverId: approval.approverId,
                            toRole: approval.toRole,
                            decision: ApprovalDecision.PENDING,
                        },
                    });
                }

                // Update original leave status
                await tx.leaveRequest.update({
                    where: { id: leaveId },
                    data: { status: LeaveStatus.CANCELLATION_REQUESTED },
                });

                // Create audit log
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { email: true },
                });

                await tx.auditLog.create({
                    data: {
                        actorEmail: user?.email || "unknown",
                        action: isPartial ? "PARTIAL_CANCELLATION_REQUESTED" : "CANCELLATION_REQUESTED",
                        targetEmail: user?.email,
                        details: {
                            originalLeaveId: leaveId,
                            cancellationRequestId: cancellation.id,
                            reason: dto.reason,
                            daysToCancel,
                            isPartial,
                        },
                    },
                });

                return cancellation;
            });

            // 4. Send notifications to first approver
            const firstApprover = approvedSteps[0];
            if (firstApprover) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true },
                });
                // Use leaveForwarded notification to alert the approver
                await NotificationService.notifyLeaveForwarded(
                    cancellationRequest.id,
                    firstApprover.approverId,
                    user?.name || "Employee"
                );
            }

            return {
                success: true,
                data: cancellationRequest,
            };
        } catch (error) {
            console.error("CancellationService.createCancellationRequest error:", error);
            return {
                success: false,
                error: {
                    code: "internal_error",
                    message: "Failed to create cancellation request",
                },
            };
        }
    }

    /**
     * Validate that a cancellation request is allowed
     */
    static async validateCancellationRequest(
        userId: number,
        leaveId: number,
        dto: CreateCancellationDTO
    ): Promise<ServiceResult<{ originalLeave: any; approvedSteps: any[] }>> {
        // 1. Get the original leave with its approvals
        const originalLeave = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
            include: {
                approvals: {
                    orderBy: { step: "asc" },
                },
                requester: {
                    select: { id: true, email: true },
                },
            },
        });

        if (!originalLeave) {
            return {
                success: false,
                error: {
                    code: "not_found",
                    message: "Leave request not found",
                },
            };
        }

        // 2. Check ownership
        if (originalLeave.requesterId !== userId) {
            return {
                success: false,
                error: {
                    code: "forbidden",
                    message: "You can only cancel your own leave requests",
                },
            };
        }

        // 3. Check status - must be APPROVED
        if (originalLeave.status !== LeaveStatus.APPROVED) {
            return {
                success: false,
                error: {
                    code: "invalid_status",
                    message: `Cannot cancel a leave with status: ${originalLeave.status}. Only APPROVED leaves can be cancelled.`,
                },
            };
        }

        // 4. Check if already has pending cancellation
        const existingCancellation = await prisma.leaveRequest.findFirst({
            where: {
                parentLeaveId: leaveId,
                isCancellationRequest: true,
                status: { in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING] },
            },
        });

        if (existingCancellation) {
            return {
                success: false,
                error: {
                    code: "already_pending",
                    message: "A cancellation request is already pending for this leave",
                },
            };
        }

        // 5. Check time limit - must be before leave ends
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const leaveEndDate = new Date(originalLeave.endDate);
        leaveEndDate.setHours(23, 59, 59, 999);

        if (today > leaveEndDate) {
            return {
                success: false,
                error: {
                    code: "leave_ended",
                    message: "Cannot cancel a leave that has already ended",
                },
            };
        }

        // 6. Validate partial cancellation dates
        if (dto.newStartDate || dto.newEndDate) {
            const newStart = dto.newStartDate || originalLeave.startDate;
            const newEnd = dto.newEndDate || originalLeave.endDate;

            if (newStart > newEnd) {
                return {
                    success: false,
                    error: {
                        code: "invalid_dates",
                        message: "New start date cannot be after new end date",
                    },
                };
            }

            // New dates must be within original range (for shrinking)
            if (newStart < originalLeave.startDate || newEnd > originalLeave.endDate) {
                return {
                    success: false,
                    error: {
                        code: "invalid_dates",
                        message: "Partial cancellation can only reduce the leave period, not extend it",
                    },
                };
            }
        }

        // 7. Get approved steps only (scope the workflow)
        const approvedSteps = originalLeave.approvals.filter(
            (a) => a.decision === ApprovalDecision.APPROVED
        );

        if (approvedSteps.length === 0) {
            return {
                success: false,
                error: {
                    code: "no_approvers",
                    message: "No approvers found for this leave request",
                },
            };
        }

        return {
            success: true,
            data: {
                originalLeave,
                approvedSteps,
            },
        };
    }

    /**
     * Finalize cancellation when fully approved.
     * Restores balance and updates original leave status.
     */
    static async finalizeCancellation(
        cancellationRequestId: number
    ): Promise<ServiceResult<any>> {
        try {
            const cancellation = await prisma.leaveRequest.findUnique({
                where: { id: cancellationRequestId },
                include: {
                    requester: true,
                },
            });

            if (!cancellation || !cancellation.parentLeaveId) {
                return {
                    success: false,
                    error: {
                        code: "not_found",
                        message: "Cancellation request not found",
                    },
                };
            }

            const originalLeave = await prisma.leaveRequest.findUnique({
                where: { id: cancellation.parentLeaveId },
            });

            if (!originalLeave) {
                return {
                    success: false,
                    error: {
                        code: "not_found",
                        message: "Original leave request not found",
                    },
                };
            }

            await prisma.$transaction(async (tx) => {
                // 1. Restore balance
                const currentYear = new Date().getFullYear();
                const daysToRestore = cancellation.workingDays;

                await tx.balance.updateMany({
                    where: {
                        userId: cancellation.requesterId,
                        type: cancellation.type,
                        year: currentYear,
                    },
                    data: {
                        used: { decrement: daysToRestore },
                        closing: { increment: daysToRestore },
                    },
                });

                // 2. Update original leave
                if (cancellation.isPartialCancellation) {
                    // Partial: update original leave dates
                    await tx.leaveRequest.update({
                        where: { id: cancellation.parentLeaveId! },
                        data: {
                            startDate: cancellation.startDate,
                            endDate: cancellation.endDate,
                            workingDays: originalLeave.workingDays - daysToRestore,
                            status: LeaveStatus.APPROVED, // Back to approved with new dates
                        },
                    });
                } else {
                    // Full: mark as cancelled
                    await tx.leaveRequest.update({
                        where: { id: cancellation.parentLeaveId! },
                        data: {
                            status: LeaveStatus.CANCELLED,
                        },
                    });
                }

                // 3. Update cancellation request status
                await tx.leaveRequest.update({
                    where: { id: cancellationRequestId },
                    data: {
                        status: LeaveStatus.APPROVED,
                    },
                });

                // 4. Audit log
                await tx.auditLog.create({
                    data: {
                        actorEmail: "system",
                        action: "CANCELLATION_FINALIZED",
                        targetEmail: cancellation.requester.email,
                        details: {
                            cancellationRequestId,
                            originalLeaveId: cancellation.parentLeaveId,
                            daysRestored: daysToRestore,
                            isPartial: cancellation.isPartialCancellation,
                        },
                    },
                });
            });

            // 5. Notify user - use cancellation notification
            await NotificationService.notifyLeaveCancelled(cancellation.parentLeaveId!);

            return {
                success: true,
                data: { message: "Cancellation finalized successfully" },
            };
        } catch (error) {
            console.error("CancellationService.finalizeCancellation error:", error);
            return {
                success: false,
                error: {
                    code: "internal_error",
                    message: "Failed to finalize cancellation",
                },
            };
        }
    }

    /**
     * Reject a cancellation request.
     * Returns original leave to APPROVED status.
     */
    static async rejectCancellation(
        cancellationRequestId: number,
        reason?: string
    ): Promise<ServiceResult<any>> {
        try {
            const cancellation = await prisma.leaveRequest.findUnique({
                where: { id: cancellationRequestId },
                include: { requester: true },
            });

            if (!cancellation || !cancellation.parentLeaveId) {
                return {
                    success: false,
                    error: {
                        code: "not_found",
                        message: "Cancellation request not found",
                    },
                };
            }

            await prisma.$transaction(async (tx) => {
                // 1. Update cancellation request
                await tx.leaveRequest.update({
                    where: { id: cancellationRequestId },
                    data: { status: LeaveStatus.REJECTED },
                });

                // 2. Restore original leave status
                await tx.leaveRequest.update({
                    where: { id: cancellation.parentLeaveId! },
                    data: { status: LeaveStatus.APPROVED },
                });

                // 3. Audit log
                await tx.auditLog.create({
                    data: {
                        actorEmail: "system",
                        action: "CANCELLATION_REJECTED",
                        targetEmail: cancellation.requester.email,
                        details: {
                            cancellationRequestId,
                            originalLeaveId: cancellation.parentLeaveId,
                            reason,
                        },
                    },
                });
            });

            // 4. Notify user - use rejection notification
            await NotificationService.notifyLeaveRejected(
                cancellationRequestId,
                "Approver",
                reason || "Cancellation request rejected"
            );

            return {
                success: true,
                data: { message: "Cancellation rejected" },
            };
        } catch (error) {
            console.error("CancellationService.rejectCancellation error:", error);
            return {
                success: false,
                error: {
                    code: "internal_error",
                    message: "Failed to reject cancellation",
                },
            };
        }
    }
}
