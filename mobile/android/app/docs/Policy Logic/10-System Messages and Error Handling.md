# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks**
> **Phase 8 (Policy v2.0) — Centralized Error Handling & Toasts**
> 1) **Centralized error mapping:** Created `/lib/errors.ts` with all error codes mapped to user-friendly messages per Policy §10.
> 2) **Standardized error format:** All API errors now include `{ error, message?, traceId, timestamp }` with optional additional fields.
> 3) **Trace ID middleware:** Created `/lib/trace.ts` utilities for attaching trace IDs to requests for error tracking.
> 4) **Updated all endpoints:** All API routes (`/api/leaves/*`) now use centralized `error()` function with trace IDs.
> 5) **Toast message mapping:** Created `/lib/toast-messages.ts` with success/warning/info message constants for frontend use.
> 6) **Error code coverage:** Added mappings for all Policy v2.0 error codes including:
>    - `el_insufficient_notice`, `cl_cannot_touch_holiday`, `start_or_end_on_holiday`
>    - `backdate_window_exceeded`, `certificate_invalid_type`, `fitness_certificate_required`
>    - `cancellation_request_invalid`, `already_cancelled`, `return_action_invalid`
> 7) **Tests:** Added unit tests for error mapping and structure; integration test scaffolding for endpoint error format validation.
> 8) **Previous changes:**
>    - EL notice fixed to reflect ≥5 working days (Phase 2).
>    - Added errors for new statuses and flows (Phase 5, Phase 6).

## Part 10: System Messages & Error Handling

This document lists all validation messages, error codes, and user-facing messages found in the codebase.

---

## 1. Error Response Format

### Standard Error Response
```json
{
  "error": "<error_code>",
  "message"?: "<optional_message>",
  "<additional_fields>"?: <values>
}
```

**HTTP Status**: Usually `400` (Bad Request) or `401` (Unauthorized) or `403` (Forbidden)

---

## 2. Authentication Errors

### Unauthorized
- **Error Code**: `unauthorized`
- **Status**: `401`
- **Message**: None (generic)
- **Location**: All protected endpoints
- **Example**: `app/api/leaves/route.ts` line 44, 108

### Forbidden
- **Error Code**: `forbidden`
- **Status**: `403`
- **Message**: "You cannot approve/reject/forward leave requests"
- **Location**: Approval endpoints
- **Examples**:
  - `app/api/leaves/[id]/approve/route.ts` line 34
  - `app/api/leaves/[id]/reject/route.ts` line 34
  - `app/api/leaves/[id]/forward/route.ts` line 30

---

## 3. Validation Errors

### Invalid Date Range
- **Error Code**: `invalid_dates`
- **Status**: `400`
- **Condition**: `start > end` or invalid date parsing
- **Location**: `app/api/leaves/route.ts` line 140

### Invalid ID
- **Error Code**: `invalid_id`
- **Status**: `400`
- **Condition**: Non-numeric or NaN ID
- **Location**: Various endpoints

### Not Found
- **Error Code**: `not_found`
- **Status**: `404`
- **Condition**: Leave request or resource doesn't exist
- **Location**: Various endpoints

---

## 4. Leave Type-Specific Errors

### Earned Leave (EL) Errors

#### Insufficient Advance Notice
- **Error Code**: `el_insufficient_notice`
- **Status**: `400`
- **Response**: 
  ```json
  {
    "error": "el_insufficient_notice",
    "required": 5,
    "provided": <days>
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 177-180
- **Policy Reference**: HR Policy 6.11 — ≥5 working days for all non-sick leave.

#### Carry-Forward Cap Exceeded
- **Error Code**: `el_carry_cap_exceeded`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "el_carry_cap_exceeded",
    "cap": 60,
    "currentTotal": <total>,
    "requested": <days>
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 325-333

### Casual Leave (CL) Errors

#### Exceeds Consecutive Limit
- **Error Code**: `cl_exceeds_consecutive_limit`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "cl_exceeds_consecutive_limit",
    "max": 3,
    "requested": <days>
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 187-190

#### Annual Cap Exceeded
- **Error Code**: `cl_annual_cap_exceeded`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "cl_annual_cap_exceeded",
    "cap": 10,
    "used": <days>,
    "requested": <days>
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 286-289

#### Cannot Touch Holiday/Weekend
- **Error Code**: `cl_cannot_touch_holiday`
- **Status**: `400`
- **Message**: "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead."
- **Location**: `app/api/leaves/route.ts` lines 241-248

### Medical Leave (ML) Errors

#### Medical Certificate Required
- **Error Code**: `medical_certificate_required`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "medical_certificate_required",
    "days": <requestedDays>,
    "requiredDays": 3
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 197-200

#### Annual Cap Exceeded
- **Error Code**: `ml_annual_cap_exceeded`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "ml_annual_cap_exceeded",
    "cap": 14,
    "used": <days>,
    "requested": <days>
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 307-310

---

## 5. Backdate Errors

### Backdate Disallowed
- **Error Code**: `backdate_disallowed_by_policy`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "backdate_disallowed_by_policy",
    "type": "CL" | "EL" | "ML"
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 210-213

### Backdate Window Exceeded
- **Error Code**: `backdate_window_exceeded`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "backdate_window_exceeded",
    "type": "<LeaveType>"
  }
  ```
- **Location**: `app/api/leaves/route.ts` line 233

---

## 6. File Upload Errors

### Unsupported File Type
- **Error Code**: `unsupported_file_type`
- **Status**: `400`
- **Message**: "Unsupported file type. Use PDF, JPG, or PNG."
- **Location**: `app/api/leaves/route.ts` line 149

### File Too Large
- **Error Code**: `file_too_large`
- **Status**: `400`
- **Message**: "File too large (max 5 MB)."
- **Location**: `app/api/leaves/route.ts` line 152

---

## 7. Balance Errors

### Insufficient Balance
- **Error Code**: `insufficient_balance`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "insufficient_balance",
    "available": <days>,
    "requested": <days>,
    "type": "<LeaveType>"
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 341-344

---

## 8. Approval Errors

### Self-Approval Disallowed
- **Error Code**: `self_approval_disallowed`
- **Status**: `403`
- **Location**: `app/api/leaves/[id]/approve/route.ts` line 56

### Self-Rejection Disallowed
- **Error Code**: `self_rejection_disallowed`
- **Status**: `403`
- **Location**: `app/api/leaves/[id]/reject/route.ts` line 56

### Invalid Status
- **Error Code**: `invalid_status`
- **Status**: `400`
- **Response**:
  ```json
  {
    "error": "invalid_status",
    "currentStatus": "<status>"
  }
  ```
- **Location**: Approval endpoints

### No Next Role
- **Error Code**: `no_next_role`
- **Status**: `400`
- **Message**: "No next role in approval chain"
- **Location**: `app/api/leaves/[id]/forward/route.ts` line 58

### Invalid Forward Target
- **Error Code**: `invalid_forward_target`
- **Status**: `400`
- **Message**: `"Cannot forward to {role}"`
- **Location**: `app/api/leaves/[id]/forward/route.ts` line 66

---

## 9. Cancellation Errors

### Cannot Cancel Now
- **Error Code**: `cannot_cancel_now`
- **Status**: `400`
- **Condition**: Status is not `SUBMITTED` or `PENDING`
- **Location**: `app/api/leaves/[id]/route.ts` line 19

### Invalid Cancellation Request
- **Error Code**: `cancellation_request_invalid`
- **Status**: `400`
- **Condition**: Requester attempts to cancel without permission or invalid status
- **Message**: "Cancellation not allowed for this request"
- **Location**: `app/api/leaves/[id]/cancel/route.ts`

### Already Cancelled
- **Error Code**: `already_cancelled`
- **Status**: `400`
- **Condition**: Leave already marked CANCELLED
- **Message**: "This leave has already been cancelled."
- **Location**: `app/api/leaves/[id]/cancel/route.ts`

### Return Action Invalid
- **Error Code**: `return_action_invalid`
- **Status**: `400`
- **Condition**: Approver attempts to return a request that is not pending
- **Message**: "Request cannot be returned at this stage."
- **Location**: `app/api/leaves/[id]/duty-return/route.ts`

---

## 10. Frontend Validation Messages

### Date Validation
- **"Start date is required"**
- **"End date is required"**
- **"End date must be on or after start date"**
- **"Invalid date range"**
- **"Start date cannot be on Friday, Saturday, or a company holiday"**
- **"End date cannot be on Friday, Saturday, or a company holiday"**

### Reason Validation
- **"Reason is required"**
- **"Reason must be at least 10 characters"**
- **Character counter**: `"{count} / 10 characters minimum"`

### File Validation
- **"Unsupported file type. Use PDF, JPG, or PNG."**
- **"File too large (max 5 MB)."**
- **"Medical certificate is required for sick leave over 3 days"**

### Balance Validation
- **"Insufficient balance for this leave type"**

### General Errors
- **"Please fix the errors in the form"**
- **"Unable to submit request"**
- **"Network error. Please try again."**

**Location**: `app/leaves/apply/_components/apply-leave-form.tsx`

---

## 11. Warning Messages

### Casual Leave Warnings
- **"Casual Leave cannot exceed 3 consecutive days."**
  - Location: `app/leaves/apply/_components/apply-leave-form.tsx` line 164

### Earned Leave Warnings
- **"Earned Leave requires 15 days' advance notice."**
  - Location: `app/leaves/apply/_components/apply-leave-form.tsx` line 169

### Medical Certificate Warnings
- **"Attach medical certificate for Sick Leave over 3 days."**
  - Location: `app/leaves/apply/_components/apply-leave-form.tsx` line 173

### Weekend/Holiday Warning
- **"Note: This range includes weekends/holidays which count toward your balance"**
  - Location: `app/leaves/apply/_components/apply-leave-form.tsx` line 156

---

## 12. Success Messages

### Toast Notifications
- **"Leave request submitted successfully"**
  - Location: `app/leaves/apply/_components/apply-leave-form.tsx` line 284

- **"Draft restored successfully"**
  - Location: `app/leaves/apply/_components/apply-leave-form.tsx` line 111

### Cancellation Success
- **"Leave request cancelled successfully"**
  - Location: `app/leaves/history/_components/CancelModal.tsx`

### Cancellation Request Submitted
- **"Cancellation request submitted and pending HR approval"**
  - Location: `app/leaves/history/_components/CancelModal.tsx`

### Return Success
- **"Leave request returned to employee for modification"**
  - Location: `app/leaves/approve/_components/ReturnModal.tsx`

---

## 13. Help Text / Information Messages

### Date Range Help
- **"All days in the range count toward balance. Start/End cannot be Fri/Sat or holidays."**
  - Location: `app/leaves/apply/_components/apply-leave-form.tsx` line 402

### Form Description
- **"Select leave type, duration, and add a short reason. Attach supporting documents when necessary."**
  - Location: `app/leaves/apply/_components/apply-leave-form.tsx` line 310

---

## 14. Policy Tip Messages (Summary Sidebar)

### CASUAL Leave Tips
- **"Max 3 consecutive days"**
- **"Must retain 5 days balance"** (documented, not enforced)

### MEDICAL Leave Tips
- **"> 3 days requires certificate"**
- **"Backdating allowed up to 30 days"**

### EARNED Leave Tips
- **"Submit at least 5 working days in advance"**
- **"Balance carries forward up to 60 days"**

**Source**: Mobile app reference docs (web-form-validation-rules.md)

---

## 15. Error Message Sources

### Frontend Messages
- **Primary Location**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Validation**: Real-time form validation
- **Display**: Error states, toast notifications

### Backend Messages
- **Primary Location**: `app/api/leaves/route.ts`
- **Format**: JSON error responses
- **Handling**: Caught by frontend, displayed via toast

---

## 16. Complete Error Code List

1. `unauthorized`
2. `forbidden`
3. `invalid_dates`
4. `invalid_id`
5. `not_found`
6. `el_insufficient_notice`
7. `el_carry_cap_exceeded`
8. `cl_exceeds_consecutive_limit`
9. `cl_annual_cap_exceeded`
10. `cl_cannot_touch_holiday`
11. `medical_certificate_required`
12. `ml_annual_cap_exceeded`
13. `backdate_disallowed_by_policy`
14. `backdate_window_exceeded`
15. `unsupported_file_type`
16. `file_too_large`
17. `insufficient_balance`
18. `self_approval_disallowed`
19. `self_rejection_disallowed`
20. `invalid_status`
21. `no_next_role`
22. `invalid_forward_target`
23. `cannot_cancel_now`
24. `invalid_input`
25. `cancellation_request_invalid`
26. `already_cancelled`
27. `return_action_invalid`

---

**Next Document**: [11-Miscellaneous Business Rules](./11-Miscellaneous-Business-Rules.md)
