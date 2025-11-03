/**
 * Centralized Error Handling for CDBL Leave Management
 * 
 * Maps all error codes to user-friendly messages and standardizes API error responses.
 * Implements Policy v2.0 error handling requirements from §10.
 */

import { randomUUID } from "crypto";

export type ApiError = {
  error: string;
  message?: string;
  traceId: string;
  timestamp: string;
  [key: string]: unknown; // Allow additional fields like required, provided, etc.
};

/**
 * Error code to default message mapping
 * All messages are user-friendly and suitable for UI display
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  unauthorized: "You are not authorized to perform this action. Please log in.",
  forbidden: "You don't have permission to perform this action.",
  
  // Validation
  invalid_dates: "Invalid date range. End date must be on or after start date.",
  invalid_id: "Invalid request ID. Please check and try again.",
  not_found: "The requested resource was not found.",
  invalid_input: "Invalid input provided. Please check your form data.",
  invalid_status: "This action cannot be performed on a leave request with this status.",
  
  // Earned Leave (EL)
  el_insufficient_notice: "Earned Leave requires at least 5 working days advance notice.",
  el_carry_cap_exceeded: "Carry-forward limit exceeded. Maximum 60 days can be carried forward.",
  
  // Casual Leave (CL)
  cl_exceeds_consecutive_limit: "Casual Leave cannot exceed 3 consecutive days.",
  cl_annual_cap_exceeded: "Annual Casual Leave limit of 10 days has been exceeded.",
  cl_cannot_touch_holiday: "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead.",
  start_or_end_on_holiday: "Start date or end date cannot be on a Friday, Saturday, or company holiday.",
  
  // Medical Leave (ML)
  medical_certificate_required: "Medical certificate is required for medical leave over 3 days.",
  ml_annual_cap_exceeded: "Annual Medical Leave limit of 14 days has been exceeded.",
  fitness_certificate_required: "Fitness certificate is required to return from medical leave over 7 days.",
  
  // Backdate
  backdate_disallowed_by_policy: "Backdating is not allowed for this leave type.",
  backdate_window_exceeded: "Backdate window exceeded. Maximum 30 days allowed for backdated leaves.",
  
  // File Upload
  unsupported_file_type: "Unsupported file type. Use PDF, JPG, or PNG.",
  file_too_large: "File too large (max 5 MB).",
  certificate_invalid_type: "Cannot determine file type. Upload a valid PDF, JPG, or PNG file.",
  file_required: "Certificate file is required.",
  
  // Balance
  insufficient_balance: "Insufficient leave balance for this request.",
  
  // Approval
  self_approval_disallowed: "You cannot approve your own leave request.",
  self_rejection_disallowed: "You cannot reject your own leave request.",
  no_next_role: "No next role in approval chain.",
  invalid_forward_target: "Cannot forward to this role.",
  
  // Cancellation
  cannot_cancel_now: "Leave request cannot be cancelled at this stage.",
  cancellation_request_invalid: "Cancellation not allowed for this request.",
  already_cancelled: "This leave has already been cancelled.",
  
  // Return/Recall
  return_action_invalid: "Request cannot be returned at this stage.",
  cannot_return_now: "Request cannot be returned at this stage.",
  cannot_recall_now: "Leave cannot be recalled at this stage.",
  cannot_recall_past_leave: "Cannot recall leaves that have already ended.",
  cannot_return_to_duty: "Cannot record return to duty for this leave.",
  invalid_leave_type: "This action is not applicable for this leave type.",
  
  // Missing parameters
  missing_params: "Missing required parameters.",
};

/**
 * Generate a standardized error response
 * 
 * @param code - Error code from ERROR_MESSAGES
 * @param message - Optional custom message (overrides default)
 * @param traceId - Optional trace ID (generated if not provided)
 * @param additionalFields - Additional fields to include in response
 * @returns ApiError object with error, message, traceId, and timestamp
 */
export function error(
  code: string,
  message?: string,
  traceId?: string,
  additionalFields?: Record<string, unknown>
): ApiError {
  const defaultMessage = ERROR_MESSAGES[code] || "An error occurred. Please try again.";
  const finalMessage = message || defaultMessage;
  const finalTraceId = traceId || randomUUID();
  
  return {
    error: code,
    message: finalMessage,
    traceId: finalTraceId,
    timestamp: new Date().toISOString(),
    ...additionalFields,
  };
}

/**
 * Create a trace ID generator (useful for middleware)
 */
export function generateTraceId(): string {
  return randomUUID();
}

/**
 * Check if an error code exists in the mapping
 */
export function isValidErrorCode(code: string): boolean {
  return code in ERROR_MESSAGES;
}

/**
 * Get the default message for an error code
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || "An error occurred. Please try again.";
}

