/**
 * Toast Message Mapping for CDBL Leave Management
 * 
 * Maps error codes and success actions to user-friendly toast messages.
 * Used by frontend components to display consistent notifications.
 */

import { getErrorMessage } from "./errors";

/**
 * Get a user-friendly toast message for an error code
 */
export function getToastMessage(errorCode: string, customMessage?: string): string {
  if (customMessage) {
    return customMessage;
  }
  return getErrorMessage(errorCode);
}

/**
 * Success messages for various actions
 */
export const SUCCESS_MESSAGES = {
  leave_submitted: "Leave request submitted successfully",
  cancellation_success: "Leave request cancelled successfully",
  cancellation_request_submitted: "Cancellation request submitted and pending HR approval",
  returned_for_modification: "Leave request returned to employee for modification",
  duty_return_success: "Return to duty recorded successfully",
  certificate_uploaded: "Certificate uploaded successfully",
  leave_approved: "Leave request approved successfully",
  leave_rejected: "Leave request rejected successfully",
  leave_forwarded: "Leave request forwarded successfully",
  leave_recalled: "Employee recalled from leave successfully",
  balance_restored: "Leave balance restored successfully",
} as const;

/**
 * Warning messages for edge cases
 */
export const WARNING_MESSAGES = {
  cl_short_notice: "Casual Leave submitted with less than 5 working days notice",
  backdate_confirmation: "This is a backdated leave. Please confirm.",
  weekend_included: "Note: This range includes weekends/holidays which count toward your balance",
} as const;

/**
 * Info messages for guidance
 */
export const INFO_MESSAGES = {
  draft_saved: "Draft saved successfully",
  draft_restored: "Draft restored successfully",
  fitness_certificate_reminder: "Fitness certificate is required for medical leave over 7 days to return to duty",
} as const;

