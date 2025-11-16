"use server";

/**
 * Server Actions for Leave Management
 * These replace client-side API calls with direct server-side mutations
 * Benefits: Type safety, automatic cache invalidation, better performance
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveService } from "@/lib/services/leave.service";
import { NotificationService } from "@/lib/services/notification.service";
import type { LeaveType } from "@prisma/client";

/**
 * Submit a new leave request
 * Replaces: POST /api/leaves
 */
export async function submitLeaveRequest(formData: {
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  needsCertificate?: boolean;
  incidentDate?: Date;
  certificateFile?: File;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await LeaveService.createLeaveRequest(user.id, formData);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to submit leave request",
      };
    }

    // Automatic cache invalidation - no manual mutate() needed!
    revalidatePath("/leaves");
    revalidatePath("/leaves/apply");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { id: result.data.id },
    };
  } catch (error) {
    console.error("submitLeaveRequest error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Forward a leave request to the next approver
 * Replaces: POST /api/leaves/[id]/forward
 */
export async function forwardLeaveRequest(leaveId: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user has permission to forward
    const userRole = user.role as string;
    if (!["HR_ADMIN", "DEPT_HEAD"].includes(userRole)) {
      return { success: false, error: "You cannot forward leave requests" };
    }

    // Get the leave request
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { approvals: true },
    });

    if (!leave) {
      return { success: false, error: "Leave request not found" };
    }

    // For now, delegate to existing API logic
    // In a full refactor, we'd move all the business logic here
    const { getNextRoleInChain, getStepForRole } = await import("@/lib/workflow");

    const nextRole = getNextRoleInChain(userRole as any, leave.type);
    if (!nextRole) {
      return { success: false, error: "No next role in approval chain" };
    }

    // Update current approval to FORWARDED
    await prisma.approval.updateMany({
      where: {
        leaveId,
        approverId: user.id,
        decision: "PENDING",
      },
      data: {
        decision: "FORWARDED",
        toRole: nextRole,
        decidedAt: new Date(),
      },
    });

    // Create next approval
    const nextApprover = await prisma.user.findFirst({
      where: { role: nextRole },
      orderBy: { id: "asc" },
    });

    if (nextApprover) {
      const nextStep = getStepForRole(nextRole, leave.type);
      await prisma.approval.create({
        data: {
          leaveId,
          step: nextStep,
          approverId: nextApprover.id,
          decision: "PENDING",
        },
      });

      // Send notification email to new approver
      await NotificationService.notifyLeaveForwarded(
        leaveId,
        nextApprover.id,
        user.name
      );
    }

    // Automatic cache invalidation
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    revalidatePath(`/leaves/${leaveId}`);

    return { success: true };
  } catch (error) {
    console.error("forwardLeaveRequest error:", error);
    return {
      success: false,
      error: "Failed to forward request",
    };
  }
}

/**
 * Approve a leave request
 * Replaces: POST /api/approvals/[id]/decision with action=approve
 */
export async function approveLeaveRequest(leaveId: number, comment?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await LeaveService.approveLeave(user.id, leaveId, comment);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to approve leave request",
      };
    }

    // Automatic cache invalidation
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/leaves");
    revalidatePath(`/leaves/${leaveId}`);

    return { success: true };
  } catch (error) {
    console.error("approveLeaveRequest error:", error);
    return {
      success: false,
      error: "Failed to approve request",
    };
  }
}

/**
 * Reject a leave request
 * Replaces: POST /api/approvals/[id]/decision with action=reject
 */
export async function rejectLeaveRequest(leaveId: number, comment?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Update approval
    await prisma.approval.updateMany({
      where: {
        leaveId,
        approverId: user.id,
        decision: "PENDING",
      },
      data: {
        decision: "REJECTED",
        comment,
        decidedAt: new Date(),
      },
    });

    // Update leave status
    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: "REJECTED" },
    });

    // Send notification email to requester
    await NotificationService.notifyLeaveRejected(
      leaveId,
      user.name,
      comment
    );

    // Automatic cache invalidation
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/leaves");
    revalidatePath(`/leaves/${leaveId}`);

    return { success: true };
  } catch (error) {
    console.error("rejectLeaveRequest error:", error);
    return {
      success: false,
      error: "Failed to reject request",
    };
  }
}

/**
 * Return a leave request for modification
 * Replaces: POST /api/leaves/[id]/return-for-modification
 */
export async function returnLeaveForModification(
  leaveId: number,
  comment: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!comment || comment.length < 5) {
      return { success: false, error: "Comment must be at least 5 characters" };
    }

    // Update approval
    await prisma.approval.updateMany({
      where: {
        leaveId,
        approverId: user.id,
        decision: "PENDING",
      },
      data: {
        decision: "RETURNED",
        comment,
        decidedAt: new Date(),
      },
    });

    // Update leave status
    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: "RETURNED" },
    });

    // Send notification email to requester
    await NotificationService.notifyLeaveReturned(
      leaveId,
      user.name,
      comment
    );

    // Automatic cache invalidation
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/leaves");
    revalidatePath(`/leaves/${leaveId}`);

    return { success: true };
  } catch (error) {
    console.error("returnLeaveForModification error:", error);
    return {
      success: false,
      error: "Failed to return request",
    };
  }
}

/**
 * Bulk approve leave requests
 * Replaces: POST /api/leaves/bulk/approve
 */
export async function bulkApproveLeaveRequests(leaveIds: number[]) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    let approved = 0;
    let failed = 0;

    for (const leaveId of leaveIds) {
      const result = await LeaveService.approveLeave(user.id, leaveId);
      if (result.success) {
        approved++;
      } else {
        failed++;
      }
    }

    // Automatic cache invalidation
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/leaves");

    return {
      success: true,
      approved,
      failed,
    };
  } catch (error) {
    console.error("bulkApproveLeaveRequests error:", error);
    return {
      success: false,
      error: "Failed to approve requests",
    };
  }
}
