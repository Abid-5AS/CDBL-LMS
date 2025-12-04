/**
 * Webhook System Types
 * Defines all webhook-related types and event structures
 */

// Webhook Event Types
export enum WebhookEvent {
  // Leave Events
  LEAVE_SUBMITTED = 'leave.submitted',
  LEAVE_APPROVED = 'leave.approved',
  LEAVE_REJECTED = 'leave.rejected',
  LEAVE_CANCELLED = 'leave.cancelled',
  LEAVE_MODIFIED = 'leave.modified',
  LEAVE_EXTENDED = 'leave.extended',

  // Approval Events
  APPROVAL_REQUESTED = 'approval.requested',
  APPROVAL_FORWARDED = 'approval.forwarded',
  APPROVAL_RETURNED = 'approval.returned',

  // Balance Events
  BALANCE_UPDATED = 'balance.updated',
  BALANCE_LOW = 'balance.low',

  // Employee Events
  EMPLOYEE_CREATED = 'employee.created',
  EMPLOYEE_UPDATED = 'employee.updated',
  EMPLOYEE_DEACTIVATED = 'employee.deactivated',

  // Encashment Events
  ENCASHMENT_REQUESTED = 'encashment.requested',
  ENCASHMENT_APPROVED = 'encashment.approved',
  ENCASHMENT_PROCESSED = 'encashment.processed',
}

// Webhook Delivery Status
export enum WebhookDeliveryStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

// Webhook Configuration
export interface WebhookConfig {
  id?: number;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  enabled?: boolean;
  description?: string;
  headers?: Record<string, string>;
  createdBy: number;
}

// Webhook Delivery Record
export interface WebhookDelivery {
  id?: number;
  webhookId: number;
  event: WebhookEvent;
  payload: WebhookPayload;
  requestUrl: string;
  requestHeaders?: Record<string, string>;
  requestBody: any;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  errorCode?: string;
  deliveredAt?: Date;
  nextRetryAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base Webhook Payload
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  meta?: {
    environment: string;
    version: string;
    requestId?: string;
  };
}

// Specific Event Payloads
export interface LeaveSubmittedPayload extends WebhookPayload {
  event: WebhookEvent.LEAVE_SUBMITTED;
  data: {
    leaveId: number;
    employeeId: number;
    employeeName: string;
    employeeEmail: string;
    department?: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    reason: string;
    status: string;
  };
}

export interface LeaveApprovedPayload extends WebhookPayload {
  event: WebhookEvent.LEAVE_APPROVED;
  data: {
    leaveId: number;
    employeeId: number;
    employeeName: string;
    employeeEmail: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    approvedBy: number;
    approverName: string;
    approverRole: string;
    approvedAt: string;
  };
}

export interface LeaveRejectedPayload extends WebhookPayload {
  event: WebhookEvent.LEAVE_REJECTED;
  data: {
    leaveId: number;
    employeeId: number;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    rejectedBy: number;
    rejectorName: string;
    rejectorRole: string;
    rejectedAt: string;
    reason?: string;
  };
}

export interface LeaveCancelledPayload extends WebhookPayload {
  event: WebhookEvent.LEAVE_CANCELLED;
  data: {
    leaveId: number;
    employeeId: number;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    cancelledAt: string;
    cancellationReason?: string;
  };
}

export interface BalanceUpdatedPayload extends WebhookPayload {
  event: WebhookEvent.BALANCE_UPDATED;
  data: {
    employeeId: number;
    employeeName: string;
    leaveType: string;
    year: number;
    opening: number;
    accrued: number;
    used: number;
    closing: number;
    changeReason: string;
  };
}

export interface EmployeeCreatedPayload extends WebhookPayload {
  event: WebhookEvent.EMPLOYEE_CREATED;
  data: {
    employeeId: number;
    empCode: string;
    name: string;
    email: string;
    department?: string;
    role: string;
    joinDate?: string;
  };
}

// Webhook Delivery Options
export interface DeliveryOptions {
  timeout?: number; // Request timeout in ms (default: 10000)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
  retryMultiplier?: number; // Exponential backoff multiplier (default: 2)
  maxRetries?: number; // Maximum retry attempts (default: 3)
}

// Webhook Signature Verification
export interface SignatureConfig {
  algorithm: 'sha256' | 'sha512';
  header: string; // Header name for signature (e.g., 'X-Webhook-Signature')
  secret: string;
}

// Webhook Event Filter
export interface EventFilter {
  events?: WebhookEvent[];
  enabled?: boolean;
  failuresOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// Webhook Statistics
export interface WebhookStats {
  webhookId: number;
  totalDeliveries: number;
  successCount: number;
  failureCount: number;
  retryCount: number;
  avgResponseTime: number;
  lastDeliveryAt?: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  successRate: number;
}

// Retry Strategy
export interface RetryStrategy {
  attempt: number;
  maxAttempts: number;
  nextRetryAt: Date;
  delay: number;
}

export function calculateRetryDelay(attempt: number, baseDelay: number = 1000, multiplier: number = 2): number {
  return Math.min(baseDelay * Math.pow(multiplier, attempt), 300000); // Max 5 minutes
}

export function calculateNextRetryTime(attempt: number, baseDelay: number = 1000): Date {
  const delay = calculateRetryDelay(attempt, baseDelay);
  return new Date(Date.now() + delay);
}

// Export all event types as a constant array
export const ALL_WEBHOOK_EVENTS = Object.values(WebhookEvent);

// Event categories for grouping
export const EVENT_CATEGORIES = {
  LEAVE: [
    WebhookEvent.LEAVE_SUBMITTED,
    WebhookEvent.LEAVE_APPROVED,
    WebhookEvent.LEAVE_REJECTED,
    WebhookEvent.LEAVE_CANCELLED,
    WebhookEvent.LEAVE_MODIFIED,
    WebhookEvent.LEAVE_EXTENDED,
  ],
  APPROVAL: [
    WebhookEvent.APPROVAL_REQUESTED,
    WebhookEvent.APPROVAL_FORWARDED,
    WebhookEvent.APPROVAL_RETURNED,
  ],
  BALANCE: [
    WebhookEvent.BALANCE_UPDATED,
    WebhookEvent.BALANCE_LOW,
  ],
  EMPLOYEE: [
    WebhookEvent.EMPLOYEE_CREATED,
    WebhookEvent.EMPLOYEE_UPDATED,
    WebhookEvent.EMPLOYEE_DEACTIVATED,
  ],
  ENCASHMENT: [
    WebhookEvent.ENCASHMENT_REQUESTED,
    WebhookEvent.ENCASHMENT_APPROVED,
    WebhookEvent.ENCASHMENT_PROCESSED,
  ],
} as const;
