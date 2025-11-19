import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canPerformAction, isFinalApprover } from "@/lib/workflow";
import type { AppRole } from "@/lib/rbac";
import type { ApprovalAction } from "@/lib/workflow";
import type { LeaveType } from "@prisma/client";

/**
 * Authorization Middleware for Leave Actions
 *
 * Centralizes all authorization logic to prevent:
 * - Self-approval
 * - Unauthorized role actions
 * - Approval chain violations
 * - Cross-department interference
 */

export interface AuthorizationResult {
  authorized: boolean;
  user: any | null;
  leave?: any;
  reason?: string;
  code?: string;
}

/**
 * Authorize a leave action with comprehensive security checks
 *
 * @param leaveId - Leave request ID
 * @param action - Action to perform (APPROVE, REJECT, FORWARD, RETURN)
 * @param options - Additional authorization options
 * @returns Authorization result with user and leave data
 */
export async function authorizeLeaveAction(
  leaveId: number,
  action: ApprovalAction,
  options: {
    requireFinalApprover?: boolean;
    allowHRAdmin?: boolean;
    checkDepartmentMatch?: boolean;
  } = {}
): Promise<AuthorizationResult> {
  // Step 1: Authenticate user
  const user = await getCurrentUser();
  if (!user) {
    return {
      authorized: false,
      user: null,
      reason: "Not authenticated",
      code: "unauthorized",
    };
  }

  // Step 2: Fetch leave request with relations
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          departmentId: true,
        },
      },
      approvals: {
        orderBy: { step: "asc" },
      },
    },
  });

  if (!leave) {
    return {
      authorized: false,
      user,
      reason: "Leave request not found",
      code: "not_found",
    };
  }

  const userRole = user.role as AppRole;
  const requesterRole = leave.requester.role as AppRole;

  // Step 3: Prevent self-approval (CRITICAL)
  if (action === "APPROVE" && leave.requesterId === user.id) {
    return {
      authorized: false,
      user,
      leave,
      reason: "Cannot approve your own leave request",
      code: "self_approval_forbidden",
    };
  }

  // Step 4: Check role permissions via workflow engine
  const canPerform = canPerformAction(
    userRole,
    action,
    leave.type as LeaveType,
    requesterRole
  );

  if (!canPerform) {
    return {
      authorized: false,
      user,
      leave,
      reason: `Role ${userRole} cannot perform ${action} on ${leave.type} leave requested by ${requesterRole}`,
      code: "insufficient_permissions",
    };
  }

  // Step 5: Check if final approver when required
  if (options.requireFinalApprover) {
    const isFinal = isFinalApprover(
      userRole,
      leave.type as LeaveType,
      requesterRole
    );

    if (!isFinal) {
      return {
        authorized: false,
        user,
        leave,
        reason: `${action} requires final approver role. ${userRole} is not the final approver for this leave type.`,
        code: "not_final_approver",
      };
    }
  }

  // Step 6: HR_ADMIN specific checks
  if (userRole === "HR_ADMIN" && !options.allowHRAdmin) {
    if (action === "APPROVE") {
      return {
        authorized: false,
        user,
        leave,
        reason: "HR Admins cannot approve leaves (operational role only)",
        code: "hr_admin_cannot_approve",
      };
    }
  }

  // Step 7: Department Head - Check department match
  if (
    userRole === "DEPT_HEAD" &&
    options.checkDepartmentMatch &&
    user.departmentId
  ) {
    if (leave.requester.departmentId !== user.departmentId) {
      return {
        authorized: false,
        user,
        leave,
        reason: "Department Head can only approve leaves from their own department",
        code: "department_mismatch",
      };
    }
  }

  // Step 8: Check if leave is in a valid status for this action
  const validStatusForAction = validateLeaveStatus(leave.status, action);
  if (!validStatusForAction.valid) {
    return {
      authorized: false,
      user,
      leave,
      reason: validStatusForAction.reason,
      code: "invalid_leave_status",
    };
  }

  // All checks passed
  return {
    authorized: true,
    user,
    leave,
  };
}

/**
 * Validate if a leave status allows a specific action
 */
function validateLeaveStatus(
  status: string,
  action: ApprovalAction
): { valid: boolean; reason?: string } {
  switch (action) {
    case "APPROVE":
    case "REJECT":
    case "FORWARD":
      if (!["SUBMITTED", "PENDING"].includes(status)) {
        return {
          valid: false,
          reason: `Cannot ${action.toLowerCase()} leave with status ${status}. Only SUBMITTED or PENDING leaves can be processed.`,
        };
      }
      break;

    case "RETURN":
      if (!["SUBMITTED", "PENDING"].includes(status)) {
        return {
          valid: false,
          reason: `Cannot return leave with status ${status}. Only SUBMITTED or PENDING leaves can be returned.`,
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Quick authorization check for viewing leave details
 * Less restrictive than action authorization
 */
export async function authorizeViewLeave(
  leaveId: number
): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      authorized: false,
      user: null,
      reason: "Not authenticated",
      code: "unauthorized",
    };
  }

  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      requester: {
        select: { id: true, email: true, role: true, departmentId: true },
      },
    },
  });

  if (!leave) {
    return {
      authorized: false,
      user,
      reason: "Leave request not found",
      code: "not_found",
    };
  }

  // User can view their own leaves
  if (leave.requesterId === user.id) {
    return { authorized: true, user, leave };
  }

  // Admins and approvers can view all leaves
  const adminRoles: AppRole[] = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];
  if (adminRoles.includes(user.role as AppRole)) {
    return { authorized: true, user, leave };
  }

  // Department heads can view their team's leaves
  if (
    user.role === "DEPT_HEAD" &&
    leave.requester.departmentId === user.departmentId
  ) {
    return { authorized: true, user, leave };
  }

  return {
    authorized: false,
    user,
    leave,
    reason: "You do not have permission to view this leave request",
    code: "forbidden",
  };
}

/**
 * Authorize balance view access
 */
export async function authorizeViewBalance(
  userId: number
): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      authorized: false,
      user: null,
      reason: "Not authenticated",
      code: "unauthorized",
    };
  }

  // Users can view their own balance
  if (user.id === userId) {
    return { authorized: true, user };
  }

  // Admins can view all balances
  const adminRoles: AppRole[] = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];
  if (adminRoles.includes(user.role as AppRole)) {
    return { authorized: true, user };
  }

  // Department heads can view their team members' balances
  if (user.role === "DEPT_HEAD" && user.departmentId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true },
    });

    if (targetUser?.departmentId === user.departmentId) {
      return { authorized: true, user };
    }
  }

  return {
    authorized: false,
    user,
    reason: "You do not have permission to view this balance",
    code: "forbidden",
  };
}
