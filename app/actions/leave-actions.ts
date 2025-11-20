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
import { invalidateHRAdminStatsCache } from "@/lib/dashboard/hr-admin-data";

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

    const result = await LeaveService.forwardLeave(leaveId, user.id);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to forward request",
      };
    }

    // Automatic cache invalidation
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    revalidatePath(`/leaves/${leaveId}`);
    invalidateHRAdminStatsCache();

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

    const result = await LeaveService.approveLeave(leaveId, user.id, comment);

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
    invalidateHRAdminStatsCache();

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

    const result = await LeaveService.rejectLeave(
      leaveId,
      user.id,
      comment || "Rejected"
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to reject leave request",
      };
    }

    // Automatic cache invalidation
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/leaves");
    invalidateHRAdminStatsCache();
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

    const result = await LeaveService.returnLeave(leaveId, user.id, comment);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to return leave request",
      };
    }

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
      const result = await LeaveService.approveLeave(leaveId, user.id);
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

/**
 * Bulk reject leave requests
 * Replaces: POST /api/leaves/bulk/reject
 */
export async function bulkRejectLeaveRequests(
  leaveIds: number[],
  reason: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!reason || reason.trim().length < 5) {
      return {
        success: false,
        error: "Rejection reason is required (minimum 5 characters)",
      };
    }

    let rejected = 0;
    let failed = 0;

    for (const leaveId of leaveIds) {
      const result = await LeaveService.rejectLeave(leaveId, user.id, reason);
      if (result.success) {
        rejected++;
      } else {
        failed++;
      }
    }

    // Automatic cache invalidation
    revalidatePath("/approvals");
    revalidatePath("/leaves");
    revalidatePath("/dashboard");
    invalidateHRAdminStatsCache();

    return {
      success: true,
      rejected,
      failed,
    };
  } catch (error) {
    console.error("bulkRejectLeaveRequests error:", error);
    return {
      success: false,
      error: "Failed to reject requests",
    };
  }
}
