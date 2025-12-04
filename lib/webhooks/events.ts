/**
 * Webhook Event Helpers
 * Convenience functions for triggering webhooks from application logic
 */

import {
  WebhookEvent,
  WebhookPayload,
  LeaveSubmittedPayload,
  LeaveApprovedPayload,
  LeaveRejectedPayload,
  LeaveCancelledPayload,
  BalanceUpdatedPayload,
  EmployeeCreatedPayload,
} from './types';
import { triggerWebhooks } from './delivery';

/**
 * Trigger leave submitted webhook
 */
export async function notifyLeaveSubmitted(data: {
  leaveId: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  department?: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  reason: string;
  status: string;
}) {
  const payload: LeaveSubmittedPayload = {
    event: WebhookEvent.LEAVE_SUBMITTED,
    timestamp: new Date().toISOString(),
    data: {
      leaveId: data.leaveId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeEmail: data.employeeEmail,
      department: data.department,
      leaveType: data.leaveType,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      workingDays: data.workingDays,
      reason: data.reason,
      status: data.status,
    },
    meta: {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  };

  await triggerWebhooks(WebhookEvent.LEAVE_SUBMITTED, payload);
}

/**
 * Trigger leave approved webhook
 */
export async function notifyLeaveApproved(data: {
  leaveId: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  approvedBy: number;
  approverName: string;
  approverRole: string;
  approvedAt: Date;
}) {
  const payload: LeaveApprovedPayload = {
    event: WebhookEvent.LEAVE_APPROVED,
    timestamp: new Date().toISOString(),
    data: {
      leaveId: data.leaveId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeEmail: data.employeeEmail,
      leaveType: data.leaveType,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      workingDays: data.workingDays,
      approvedBy: data.approvedBy,
      approverName: data.approverName,
      approverRole: data.approverRole,
      approvedAt: data.approvedAt.toISOString(),
    },
    meta: {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  };

  await triggerWebhooks(WebhookEvent.LEAVE_APPROVED, payload);
}

/**
 * Trigger leave rejected webhook
 */
export async function notifyLeaveRejected(data: {
  leaveId: number;
  employeeId: number;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  rejectedBy: number;
  rejectorName: string;
  rejectorRole: string;
  rejectedAt: Date;
  reason?: string;
}) {
  const payload: LeaveRejectedPayload = {
    event: WebhookEvent.LEAVE_REJECTED,
    timestamp: new Date().toISOString(),
    data: {
      leaveId: data.leaveId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      leaveType: data.leaveType,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      rejectedBy: data.rejectedBy,
      rejectorName: data.rejectorName,
      rejectorRole: data.rejectorRole,
      rejectedAt: data.rejectedAt.toISOString(),
      reason: data.reason,
    },
    meta: {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  };

  await triggerWebhooks(WebhookEvent.LEAVE_REJECTED, payload);
}

/**
 * Trigger leave cancelled webhook
 */
export async function notifyLeaveCancelled(data: {
  leaveId: number;
  employeeId: number;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  cancelledAt: Date;
  cancellationReason?: string;
}) {
  const payload: LeaveCancelledPayload = {
    event: WebhookEvent.LEAVE_CANCELLED,
    timestamp: new Date().toISOString(),
    data: {
      leaveId: data.leaveId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      leaveType: data.leaveType,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      cancelledAt: data.cancelledAt.toISOString(),
      cancellationReason: data.cancellationReason,
    },
    meta: {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  };

  await triggerWebhooks(WebhookEvent.LEAVE_CANCELLED, payload);
}

/**
 * Trigger balance updated webhook
 */
export async function notifyBalanceUpdated(data: {
  employeeId: number;
  employeeName: string;
  leaveType: string;
  year: number;
  opening: number;
  accrued: number;
  used: number;
  closing: number;
  changeReason: string;
}) {
  const payload: BalanceUpdatedPayload = {
    event: WebhookEvent.BALANCE_UPDATED,
    timestamp: new Date().toISOString(),
    data: {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      leaveType: data.leaveType,
      year: data.year,
      opening: data.opening,
      accrued: data.accrued,
      used: data.used,
      closing: data.closing,
      changeReason: data.changeReason,
    },
    meta: {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  };

  await triggerWebhooks(WebhookEvent.BALANCE_UPDATED, payload);
}

/**
 * Trigger employee created webhook
 */
export async function notifyEmployeeCreated(data: {
  employeeId: number;
  empCode: string;
  name: string;
  email: string;
  department?: string;
  role: string;
  joinDate?: Date;
}) {
  const payload: EmployeeCreatedPayload = {
    event: WebhookEvent.EMPLOYEE_CREATED,
    timestamp: new Date().toISOString(),
    data: {
      employeeId: data.employeeId,
      empCode: data.empCode,
      name: data.name,
      email: data.email,
      department: data.department,
      role: data.role,
      joinDate: data.joinDate?.toISOString(),
    },
    meta: {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  };

  await triggerWebhooks(WebhookEvent.EMPLOYEE_CREATED, payload);
}

/**
 * Trigger approval requested webhook
 */
export async function notifyApprovalRequested(data: {
  leaveId: number;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  approverId: number;
  approverName: string;
  approverRole: string;
}) {
  const payload: WebhookPayload = {
    event: WebhookEvent.APPROVAL_REQUESTED,
    timestamp: new Date().toISOString(),
    data: {
      leaveId: data.leaveId,
      employeeName: data.employeeName,
      leaveType: data.leaveType,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      approverId: data.approverId,
      approverName: data.approverName,
      approverRole: data.approverRole,
    },
    meta: {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  };

  await triggerWebhooks(WebhookEvent.APPROVAL_REQUESTED, payload);
}

/**
 * Trigger leave modified webhook
 */
export async function notifyLeaveModified(data: {
  leaveId: number;
  employeeId: number;
  employeeName: string;
  leaveType: string;
  oldStartDate: Date;
  oldEndDate: Date;
  newStartDate: Date;
  newEndDate: Date;
  modifiedAt: Date;
  modifiedBy: number;
  reason?: string;
}) {
  const payload: WebhookPayload = {
    event: WebhookEvent.LEAVE_MODIFIED,
    timestamp: new Date().toISOString(),
    data: {
      leaveId: data.leaveId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      leaveType: data.leaveType,
      oldStartDate: data.oldStartDate.toISOString(),
      oldEndDate: data.oldEndDate.toISOString(),
      newStartDate: data.newStartDate.toISOString(),
      newEndDate: data.newEndDate.toISOString(),
      modifiedAt: data.modifiedAt.toISOString(),
      modifiedBy: data.modifiedBy,
      reason: data.reason,
    },
    meta: {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  };

  await triggerWebhooks(WebhookEvent.LEAVE_MODIFIED, payload);
}
