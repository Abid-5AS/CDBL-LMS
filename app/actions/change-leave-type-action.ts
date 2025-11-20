"use server";

/**
 * Server Action: Change Leave Type During Approval
 * Allows managers/HR to reclassify a leave request to a different type
 * with proper balance validation and audit trail
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LeaveType } from "@prisma/client";
import { invalidateHRAdminStatsCache } from "@/lib/dashboard/hr-admin-data";

export async function changeLeaveType(
  leaveId: number,
  newType: LeaveType,
  reason: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return {
        success: false,
        error: "Please provide a reason for changing the leave type (minimum 10 characters)",
      };
    }

    // Fetch the leave request
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        requester: true,
        approvals: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!leave) {
      return { success: false, error: "Leave request not found" };
    }

    // Check if leave is in pending/submitted status
    if (!["PENDING", "SUBMITTED"].includes(leave.status)) {
      return {
        success: false,
        error: "Leave type can only be changed while the request is pending approval",
      };
    }

    // Check if new type is different
    if (leave.type === newType) {
      return {
        success: false,
        error: "New leave type must be different from current type",
      };
    }

    // Verify user has permission to approve (can change type)
    const canApprove = await verifyApprovalPermission(leave, parseInt(user.id));
    if (!canApprove) {
      return {
        success: false,
        error: "You don't have permission to modify this leave request",
      };
    }

    // Check employee balance for new type
    const employeeId = leave.requesterId;
    const year = new Date(leave.startDate).getFullYear();
    
    const balance = await prisma.balance.findFirst({
      where: {
        userId: employeeId,
        type: newType,
        year,
      },
    });

    if (!balance) {
      return {
        success: false,
        error: `Employee doesn't have a balance entry for ${newType}`,
      };
    }

    const requestedDays = leave.workingDays;
    if (balance.closing < requestedDays) {
      return {
        success: false,
        error: `Insufficient ${newType} balance. Employee has ${balance.closing} days, but requesting ${requestedDays} days.`,
      };
    }

    // Update leave type in transaction
    await prisma.$transaction(async (tx) => {
      // Update the leave request type
      await tx.leaveRequest.update({
        where: { id: leaveId },
        data: {
          type: newType,
        },
      });

      // Add approval comment documenting the change
      await tx.approval.create({
        data: {
          leaveId: leaveId,
          approverId: parseInt(user.id),
          decision: "PENDING",
          comment: `Leave type changed from ${leave.type} to ${newType}. Reason: ${reason.trim()}`,
          decidedAt: new Date(),
          step: leave.approvals.length + 1,
        },
      });
    });

    // Send notification to employee
    await prisma.notification.create({
      data: {
        userId: employeeId,
        type: "LEAVE_TYPE_CHANGED",
        title: "Leave Type Modified",
        message: `Your leave request type has been changed from ${leave.type} to ${newType} by ${user.name}. Reason: ${reason.trim()}`,
        link: `/leaves/${leaveId}`,
      },
    });

    // Revalidate caches
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/leaves");
    revalidatePath(`/leaves/${leaveId}`);
    invalidateHRAdminStatsCache();

    return {
      success: true,
      message: `Leave type successfully changed from ${leave.type} to ${newType}`,
    };
  } catch (error) {
    console.error("changeLeaveType error:", error);
    return {
      success: false,
      error: "Failed to change leave type. Please try again.",
    };
  }
}

/**
 * Helper: Verify user has permission to approve/modify this leave
 */
async function verifyApprovalPermission(
  leave: any,
  userId: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return false;

  // HR Admin and HR Head can modify any leave
  if (["HR_ADMIN", "HR_HEAD"].includes(user.role)) {
    return true;
  }

  // Department Head can modify leaves in their department  
  if (user.role === "DEPT_HEAD") {
    const requester = await prisma.user.findUnique({
      where: { id: leave.requesterId },
      select: { department: true },
    });
    return requester?.department === user.department;
  }

  return false;
}
