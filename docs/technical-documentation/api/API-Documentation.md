# CDBL Leave Management System - API Documentation

**Version:** 2.0
**Last Updated:** January 2025
**Base URL:** `/api`
**Protocol:** REST over HTTPS

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-apis)
   - [Leave Management](#leave-management-apis)
   - [Approvals](#approval-apis)
   - [Balances](#balance-apis)
   - [Holidays](#holiday-apis)
   - [Employees](#employee-apis)
   - [Dashboard](#dashboard-apis)
   - [Admin](#admin-apis)
   - [Compliance](#compliance-apis)
   - [Notifications](#notification-apis)
7. [Query Parameters](#query-parameters)
8. [Request Examples](#request-examples)
9. [Security](#security)

---

## Overview

The CDBL Leave Management System exposes a RESTful API built on Next.js 16 App Router. All endpoints return JSON responses and use standard HTTP status codes.

### API Characteristics

- **Architecture**: RESTful API
- **Format**: JSON request/response
- **Authentication**: JWT tokens via HTTP-only cookies
- **Authorization**: Role-based access control (RBAC)
- **Caching**: No-cache for all endpoints (dynamic data)
- **CORS**: Same-origin only (web application only)

---

## Authentication

### Authentication Method

The API uses **JWT (JSON Web Token)** authentication with HTTP-only cookies for security.

**Token Storage:**
- `jwt`: HTTP-only cookie containing the JWT token
- `auth_user_email`: User email (for client-side display)
- `auth_user_name`: User name (for client-side display)
- `auth_user_role`: User role (for client-side display)

**Token Lifecycle:**
- Issued on successful login + 2FA verification
- Expires after 7 days of inactivity
- Automatically refreshed on each request
- Cleared on logout

### Required Headers

For authenticated requests:
```
Cookie: jwt=<token>; auth_user_email=<email>; ...
```

No additional headers required (cookies handled automatically by browser).

---

## Response Format

### Success Response

```json
{
  "ok": true,
  "data": { ... },
  "meta": { ... }  // Optional metadata
}
```

**For list endpoints:**
```json
{
  "items": [ ... ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### Error Response

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": { ... }  // Optional details
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Meaning | Usage |
|-------------|---------|-------|
| `200` | OK | Successful request |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Validation error or invalid request |
| `401` | Unauthorized | Not authenticated |
| `403` | Forbidden | Authenticated but not authorized |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource conflict (e.g., duplicate) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `unauthorized` | 401 | Missing or invalid JWT token |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource does not exist |
| `invalid_credentials` | 401 | Email/password incorrect |
| `validation_error` | 400 | Request validation failed |
| `insufficient_balance` | 400 | Not enough leave balance |
| `policy_violation` | 400 | Leave request violates policy |
| `self_approval_disallowed` | 403 | Cannot approve own request |

---

## Rate Limiting

### Rate Limits

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| `POST /api/login` | 5 requests | 15 minutes | Per IP |
| `POST /api/auth/verify-otp` | 3 attempts | Per OTP code | Per user |
| `POST /api/auth/resend-otp` | 3 requests | 15 minutes | Per user |

### Rate Limit Response

When rate limit is exceeded:

**Status:** `429 Too Many Requests`

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900  // Seconds until retry allowed
}
```

---

## API Endpoints

## Authentication APIs

### POST /api/login

**Purpose:** Authenticate user with email and password

**Request Body:**
```json
{
  "email": "user@cdbl.com",
  "password": "SecurePassword123"
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required, min 6 characters

**Response (Success - 2FA Enabled):**
```json
{
  "ok": true,
  "requiresOtp": true,
  "userId": 123,
  "email": "user@cdbl.com",
  "expiresIn": 600
}
```

**Response (Success - 2FA Disabled):**
```json
{
  "ok": true,
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "user@cdbl.com",
    "role": "EMPLOYEE"
  }
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `429`: Rate limit exceeded

**Cookies Set (if 2FA disabled):**
- `jwt`: JWT token (HTTP-only)
- `auth_user_email`: User email
- `auth_user_name`: User name
- `auth_user_role`: User role

**Location:** `app/api/login/route.ts`

---

### POST /api/auth/verify-otp

**Purpose:** Verify OTP code and complete 2FA login

**Request Body:**
```json
{
  "email": "user@cdbl.com",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "user@cdbl.com",
    "role": "EMPLOYEE",
    "department": "IT"
  }
}
```

**Response (Invalid Code):**
```json
{
  "error": "invalid_otp",
  "message": "Invalid code. 2 attempts remaining.",
  "attemptsRemaining": 2
}
```

**Response (Expired Code):**
```json
{
  "error": "otp_expired",
  "message": "Verification code has expired. Please request a new one."
}
```

**Errors:**
- `400`: Invalid or expired OTP
- `401`: Too many failed attempts
- `404`: No OTP found for email

**Cookies Set:**
- `jwt`: JWT token (HTTP-only)
- `auth_user_email`: User email
- `auth_user_name`: User name
- `auth_user_role`: User role

**Location:** `app/api/auth/verify-otp/route.ts`

---

### POST /api/auth/resend-otp

**Purpose:** Resend OTP verification code

**Request Body:**
```json
{
  "email": "user@cdbl.com"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "New verification code sent to your email",
  "expiresIn": 600
}
```

**Errors:**
- `429`: Rate limit exceeded (must wait 1 minute)
- `404`: User not found

**Location:** `app/api/auth/resend-otp/route.ts`

---

### POST /api/logout

**Purpose:** Log out current user and clear session

**Request:** No body required

**Response:**
```json
{
  "ok": true
}
```

**Cookies Cleared:** All authentication cookies

**Location:** `app/api/logout/route.ts`

---

### GET /api/auth/me

**Purpose:** Get current authenticated user information

**Authentication:** Required

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "user@cdbl.com",
    "role": "EMPLOYEE",
    "department": "IT",
    "empCode": "EMP001",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
- `401`: Not authenticated

**Location:** `app/api/auth/me/route.ts`

---

## Leave Management APIs

### GET /api/leaves

**Purpose:** List leave requests with filters

**Authentication:** Required

**Query Parameters:**
- `mine` (optional): `true` to show only user's own leaves
- `type` (optional): Filter by leave type (`EARNED`, `CASUAL`, `MEDICAL`)
- `status` (optional): Filter by status (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`)
- `year` (optional): Filter by year (e.g., `2024`)
- `userId` (optional): Filter by user ID (admin only)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "type": "EARNED",
      "startDate": "2024-10-23T00:00:00.000Z",
      "endDate": "2024-10-28T00:00:00.000Z",
      "workingDays": 6,
      "reason": "Family vacation",
      "status": "PENDING",
      "needsCertificate": false,
      "certificateUrl": null,
      "createdAt": "2024-10-10T08:15:00.000Z",
      "updatedAt": "2024-10-10T08:15:00.000Z",
      "requester": {
        "id": 123,
        "name": "John Doe",
        "email": "user@cdbl.com",
        "role": "EMPLOYEE"
      },
      "approvals": [
        {
          "id": 1,
          "step": 1,
          "decision": "FORWARDED",
          "toRole": "DEPT_HEAD",
          "decidedAt": "2024-10-10T09:00:00.000Z",
          "approver": {
            "name": "HR Admin",
            "role": "HR_ADMIN"
          }
        }
      ]
    }
  ],
  "total": 25
}
```

**Authorization:**
- `EMPLOYEE`: Can only see own leaves (even if `mine` not specified)
- `DEPT_HEAD`: Can see own + team members
- `HR_ADMIN`, `HR_HEAD`, `CEO`: Can see all leaves

**Location:** `app/api/leaves/route.ts`

---

### POST /api/leaves

**Purpose:** Create new leave request

**Authentication:** Required

**Content-Type:** `application/json` or `multipart/form-data`

**Request Body (JSON):**
```json
{
  "type": "EARNED",
  "startDate": "2024-11-20T00:00:00.000Z",
  "endDate": "2024-11-25T00:00:00.000Z",
  "workingDays": 6,
  "reason": "Family vacation to Cox's Bazar",
  "needsCertificate": false
}
```

**Request Body (FormData - with certificate):**
```
type: MEDICAL
startDate: 2024-11-15T00:00:00.000Z
endDate: 2024-11-18T00:00:00.000Z
workingDays: 4
reason: Medical treatment
needsCertificate: true
certificate: [File object - PDF/JPG/PNG, max 5MB]
```

**Response (Success):**
```json
{
  "ok": true,
  "id": 42,
  "warnings": {
    "clShortNotice": true,
    "approachingAnnualCap": false
  }
}
```

**Validation Rules:**
- `type`: Required, valid LeaveType enum
- `startDate`: Required, valid date, not in past (unless backdating allowed)
- `endDate`: Required, >= startDate
- `workingDays`: Required, > 0, matches date range
- `reason`: Required, min 10 characters, max 500 characters
- `needsCertificate`: Required boolean
- `certificate`: Required if `needsCertificate=true` and type=MEDICAL and days>3

**Policy Validations:**
- EL requires 15 days advance notice
- CL max 3 consecutive days
- ML > 3 days requires medical certificate
- Cannot start/end on weekend or holiday
- CL cannot touch weekends/holidays
- Sufficient balance required
- Annual caps enforced (CL: 10 days, ML: 14 days)
- Carry-forward cap enforced (EL: 60 days)

**Error Codes:**
```json
{
  "error": "el_insufficient_notice",
  "message": "Earned leave requires 15 days advance notice",
  "details": {
    "required": 15,
    "provided": 7
  }
}
```

**Common Error Codes:**
- `invalid_dates`: Date range invalid
- `el_insufficient_notice`: EL advance notice < 15 days
- `cl_exceeds_consecutive_limit`: CL > 3 consecutive days
- `medical_certificate_required`: ML > 3 days without certificate
- `backdate_disallowed_by_policy`: Backdating not allowed for leave type
- `backdate_window_exceeded`: Backdate > 30 days in past
- `cl_cannot_touch_holiday`: CL includes weekend or holiday
- `cl_annual_cap_exceeded`: Total CL for year > 10 days
- `ml_annual_cap_exceeded`: Total ML for year > 14 days
- `el_carry_cap_exceeded`: Carry-forward EL > 60 days
- `insufficient_balance`: Not enough leave balance
- `unsupported_file_type`: Certificate file type not allowed
- `file_too_large`: Certificate file > 5MB

**Location:** `app/api/leaves/route.ts`

---

### GET /api/leaves/[id]

**Purpose:** Get single leave request details

**Authentication:** Required

**Response:**
```json
{
  "id": 1,
  "type": "EARNED",
  "startDate": "2024-10-23T00:00:00.000Z",
  "endDate": "2024-10-28T00:00:00.000Z",
  "workingDays": 6,
  "reason": "Family vacation",
  "status": "APPROVED",
  "needsCertificate": false,
  "certificateUrl": null,
  "policyVersion": "v1.1",
  "createdAt": "2024-10-10T08:15:00.000Z",
  "updatedAt": "2024-10-15T14:30:00.000Z",
  "requester": {
    "id": 123,
    "name": "John Doe",
    "email": "user@cdbl.com",
    "role": "EMPLOYEE",
    "department": "IT"
  },
  "approvals": [
    {
      "id": 1,
      "step": 1,
      "decision": "FORWARDED",
      "toRole": "DEPT_HEAD",
      "comment": null,
      "decidedAt": "2024-10-10T09:00:00.000Z",
      "approver": {
        "id": 5,
        "name": "HR Admin",
        "email": "hradmin@cdbl.com",
        "role": "HR_ADMIN"
      }
    },
    {
      "id": 2,
      "step": 2,
      "decision": "FORWARDED",
      "toRole": "HR_HEAD",
      "comment": "Approved by department",
      "decidedAt": "2024-10-11T10:30:00.000Z",
      "approver": {
        "id": 7,
        "name": "Dept Head",
        "email": "depthead@cdbl.com",
        "role": "DEPT_HEAD"
      }
    },
    {
      "id": 3,
      "step": 3,
      "decision": "APPROVED",
      "toRole": null,
      "comment": "Approved",
      "decidedAt": "2024-10-15T14:30:00.000Z",
      "approver": {
        "id": 9,
        "name": "HR Head",
        "email": "hrhead@cdbl.com",
        "role": "HR_HEAD"
      }
    }
  ]
}
```

**Authorization:**
- Own leave requests: All users
- Other users' leaves: HR_ADMIN, HR_HEAD, CEO only

**Errors:**
- `404`: Leave not found
- `403`: Not authorized to view this leave

**Location:** `app/api/leaves/[id]/route.ts`

---

### PATCH /api/leaves/[id]

**Purpose:** Cancel leave request

**Authentication:** Required

**Request:** No body required

**Response:**
```json
{
  "ok": true,
  "id": 1,
  "status": "CANCELLED"
}
```

**Business Rules:**
- Only owner can cancel their leave
- Only PENDING or SUBMITTED leaves can be cancelled
- Approved leaves cannot be cancelled (must contact HR)

**Errors:**
- `400`: `cannot_cancel_now` - Status not PENDING/SUBMITTED
- `403`: `forbidden` - Not the leave owner
- `404`: Leave not found

**Location:** `app/api/leaves/[id]/route.ts`

---

### POST /api/leaves/[id]/approve

**Purpose:** Approve leave request (final decision)

**Authentication:** Required

**Authorization:** HR_HEAD or CEO roles only

**Request Body:**
```json
{
  "comment": "Approved for family vacation"
}
```

**Response:**
```json
{
  "ok": true,
  "status": "APPROVED",
  "approval": {
    "id": 5,
    "step": 3,
    "decision": "APPROVED",
    "decidedAt": "2024-10-15T14:30:00.000Z"
  }
}
```

**Business Rules:**
- Cannot approve own requests (self_approval_disallowed)
- Leave must be in SUBMITTED or PENDING status
- Only HR_HEAD or CEO can approve
- Approval is final (cannot be undone)

**Audit Log:** Creates `LEAVE_APPROVE` audit entry

**Errors:**
- `400`: `invalid_status` - Leave not in approvable state
- `403`: `self_approval_disallowed` - Cannot approve own leave
- `403`: `forbidden` - Insufficient role permissions
- `404`: Leave not found

**Location:** `app/api/leaves/[id]/approve/route.ts`

---

### POST /api/leaves/[id]/reject

**Purpose:** Reject leave request (final decision)

**Authentication:** Required

**Authorization:** HR_HEAD or CEO roles only

**Request Body:**
```json
{
  "comment": "Insufficient coverage during this period"
}
```

**Response:**
```json
{
  "ok": true,
  "status": "REJECTED",
  "approval": {
    "id": 5,
    "step": 3,
    "decision": "REJECTED",
    "comment": "Insufficient coverage during this period",
    "decidedAt": "2024-10-15T14:30:00.000Z"
  }
}
```

**Business Rules:**
- Same as approve endpoint
- Rejection is final
- Balance not deducted (or restored if previously deducted)

**Audit Log:** Creates `LEAVE_REJECT` audit entry

**Errors:** Same as approve endpoint

**Location:** `app/api/leaves/[id]/reject/route.ts`

---

### POST /api/leaves/[id]/forward

**Purpose:** Forward leave request to next approver in chain

**Authentication:** Required

**Authorization:** HR_ADMIN or DEPT_HEAD roles

**Request:** No body required (automatically determines next approver)

**Response:**
```json
{
  "ok": true,
  "status": "PENDING",
  "forwardedTo": "DEPT_HEAD",
  "approval": {
    "id": 3,
    "step": 2,
    "decision": "FORWARDED",
    "toRole": "DEPT_HEAD",
    "decidedAt": "2024-10-10T09:15:00.000Z"
  }
}
```

**Approval Chain:**
```
HR_ADMIN (step 1) → DEPT_HEAD (step 2) → HR_HEAD (step 3) → CEO (step 4)
```

**Business Rules:**
- HR_ADMIN can forward to: DEPT_HEAD
- DEPT_HEAD can forward to: HR_HEAD
- HR_HEAD should approve/reject (not forward), but can forward to CEO
- CEO is final step (cannot forward)

**Audit Log:** Creates `LEAVE_FORWARD` audit entry

**Errors:**
- `400`: `no_next_role` - No next role in chain
- `400`: `invalid_forward_target` - Invalid forwarding
- `400`: `invalid_status` - Leave not in forwardable state
- `403`: `forbidden` - Insufficient permissions

**Location:** `app/api/leaves/[id]/forward/route.ts`

---

## Approval APIs

### GET /api/approvals

**Purpose:** Get pending approvals for current user's role

**Authentication:** Required

**Authorization:** HR_ADMIN, DEPT_HEAD, HR_HEAD, CEO

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "type": "EARNED",
      "startDate": "2024-11-20T00:00:00.000Z",
      "endDate": "2024-11-25T00:00:00.000Z",
      "workingDays": 6,
      "status": "PENDING",
      "requester": {
        "id": 123,
        "name": "John Doe",
        "email": "user@cdbl.com",
        "department": "IT"
      },
      "approvals": [...]
    }
  ],
  "total": 5
}
```

**Filtering Logic:**
- Returns only leaves pending approval by current user's role
- Sorted by creation date (oldest first)

**Location:** `app/api/approvals/route.ts`

---

## Balance APIs

### GET /api/balance/mine

**Purpose:** Get current user's leave balances

**Authentication:** Required

**Response:**
```json
{
  "balances": {
    "EARNED": {
      "opening": 10,
      "accrued": 10,
      "used": 5,
      "total": 20,
      "remaining": 15,
      "carryLimit": 60
    },
    "CASUAL": {
      "opening": 0,
      "accrued": 10,
      "used": 3,
      "total": 10,
      "remaining": 7,
      "annualCap": 10
    },
    "MEDICAL": {
      "opening": 0,
      "accrued": 14,
      "used": 0,
      "total": 14,
      "remaining": 14,
      "annualCap": 14
    }
  },
  "year": 2024
}
```

**Balance Calculation:**
- `total = opening + accrued`
- `remaining = total - used`
- `opening`: Carry-forward from previous year (EL only)
- `accrued`: This year's allocation
- `used`: Days used this year

**Location:** `app/api/balance/mine/route.ts`

---

## Holiday APIs

### GET /api/holidays

**Purpose:** Get list of company holidays

**Authentication:** Not required (public information)

**Query Parameters:**
- `year` (optional): Filter by year (e.g., `2024`)
- `upcoming` (optional): `true` to show only future holidays
- `optional` (optional): `true` to show only optional holidays

**Response:**
```json
{
  "holidays": [
    {
      "id": 1,
      "date": "2024-12-16T00:00:00.000Z",
      "name": "Victory Day",
      "isOptional": false
    },
    {
      "id": 2,
      "date": "2024-12-25T00:00:00.000Z",
      "name": "Christmas Day",
      "isOptional": true
    }
  ],
  "total": 15,
  "year": 2024
}
```

**Location:** `app/api/holidays/route.ts`

---

### POST /api/holidays

**Purpose:** Create new holiday

**Authentication:** Required

**Authorization:** HR_ADMIN, HR_HEAD, CEO

**Request Body:**
```json
{
  "date": "2024-12-31T00:00:00.000Z",
  "name": "New Year's Eve",
  "isOptional": false
}
```

**Response:**
```json
{
  "ok": true,
  "id": 16,
  "holiday": {
    "id": 16,
    "date": "2024-12-31T00:00:00.000Z",
    "name": "New Year's Eve",
    "isOptional": false
  }
}
```

**Validation:**
- `date`: Required, unique
- `name`: Required, min 3 characters
- `isOptional`: Required boolean

**Errors:**
- `409`: Holiday already exists for this date
- `400`: Validation error

**Location:** `app/api/holidays/route.ts`

---

## Dashboard APIs

### GET /api/dashboard/analytics

**Purpose:** Get dashboard analytics and statistics

**Authentication:** Required

**Query Parameters:**
- `year` (optional): Filter by year (default: current year)

**Response:**
```json
{
  "monthlyUsage": [
    { "month": "Jan", "earned": 2, "casual": 1, "medical": 0 },
    { "month": "Feb", "earned": 0, "casual": 2, "medical": 1 }
  ],
  "typeDistribution": {
    "EARNED": 45,
    "CASUAL": 35,
    "MEDICAL": 20
  },
  "trends": {
    "totalLeaves": 25,
    "approvalRate": 92.5,
    "avgProcessingDays": 2.3
  },
  "upcomingLeaves": [...]
}
```

**Location:** `app/api/dashboard/analytics/route.ts`

---

### GET /api/dashboard/alerts

**Purpose:** Get dashboard alerts and reminders

**Authentication:** Required

**Response:**
```json
{
  "alerts": [
    {
      "type": "policy_reminder",
      "severity": "info",
      "message": "Earned leave requires 15 days advance notice",
      "icon": "info"
    },
    {
      "type": "balance_warning",
      "severity": "warning",
      "message": "Your casual leave balance is low (2 days remaining)",
      "icon": "alert-triangle"
    }
  ]
}
```

**Location:** `app/api/dashboard/alerts/route.ts`

---

## Admin APIs

### GET /api/admin/users

**Purpose:** List all users

**Authentication:** Required

**Authorization:** HR_ADMIN, HR_HEAD, CEO

**Response:**
```json
{
  "users": [
    {
      "id": 123,
      "name": "John Doe",
      "email": "user@cdbl.com",
      "role": "EMPLOYEE",
      "department": "IT",
      "empCode": "EMP001",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "total": 50
}
```

**Location:** `app/api/admin/users/route.ts`

---

### POST /api/admin/users/create

**Purpose:** Create new user

**Authentication:** Required

**Authorization:** HR_ADMIN, HR_HEAD, CEO

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@cdbl.com",
  "password": "TempPassword123",
  "role": "EMPLOYEE",
  "department": "Finance",
  "empCode": "EMP052"
}
```

**Response:**
```json
{
  "ok": true,
  "id": 124,
  "user": {
    "id": 124,
    "name": "Jane Smith",
    "email": "jane@cdbl.com",
    "role": "EMPLOYEE"
  }
}
```

**Validation:**
- `email`: Unique, valid email format
- `empCode`: Optional but must be unique if provided
- `password`: Min 6 characters
- `role`: Valid Role enum

**Errors:**
- `409`: Email or empCode already exists
- `400`: Validation error

**Location:** `app/api/admin/users/create/route.ts`

---

### GET /api/admin/logs

**Purpose:** Get audit logs

**Authentication:** Required

**Authorization:** HR_ADMIN, HR_HEAD, CEO

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `action` (optional): Filter by action type
- `actorEmail` (optional): Filter by actor email

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "actorEmail": "hradmin@cdbl.com",
      "action": "LEAVE_APPROVE",
      "targetEmail": "user@cdbl.com",
      "details": {
        "leaveId": 42,
        "leaveType": "EARNED",
        "decision": "APPROVED"
      },
      "createdAt": "2024-10-15T14:30:00.000Z"
    }
  ],
  "total": 250,
  "limit": 50,
  "offset": 0
}
```

**Action Types:**
- `LOGIN`: User login
- `LEAVE_APPROVE`: Leave approved
- `LEAVE_REJECT`: Leave rejected
- `LEAVE_FORWARD`: Leave forwarded
- `LEAVE_BACKDATE_ASK`: Backdate confirmation
- `POLICY_NOTE`: Policy-related note

**Location:** `app/api/admin/logs/route.ts`

---

## Compliance APIs

### GET /api/compliance/validate

**Purpose:** Validate policy compliance across all leave requests

**Authentication:** Required

**Authorization:** HR_HEAD, CEO

**Response:**
```json
{
  "checks": [
    {
      "rule": "Casual Leave Annual Cap",
      "status": "pass",
      "message": "All users within 10-day annual limit",
      "details": {
        "violations": 0,
        "checked": 50
      }
    },
    {
      "rule": "Medical Leave Certificate Requirement",
      "status": "warning",
      "message": "2 medical leaves > 3 days missing certificates",
      "details": {
        "violations": 2,
        "leaveIds": [42, 58]
      }
    }
  ],
  "overallStatus": "warning",
  "timestamp": "2024-10-20T10:00:00.000Z"
}
```

**Location:** `app/api/compliance/validate/route.ts`

---

## Query Parameters

### Common Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `year` | number | Filter by year | `?year=2024` |
| `type` | string | Filter by leave type | `?type=EARNED` |
| `status` | string | Filter by status | `?status=PENDING` |
| `mine` | boolean | Filter to current user | `?mine=true` |
| `upcoming` | boolean | Future items only | `?upcoming=true` |
| `limit` | number | Items per page | `?limit=20` |
| `offset` | number | Pagination offset | `?offset=40` |

---

## Request Examples

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@cdbl.com","password":"password123"}' \
  -c cookies.txt
```

**Create Leave Request:**
```bash
curl -X POST http://localhost:3000/api/leaves \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type":"EARNED",
    "startDate":"2024-11-20T00:00:00.000Z",
    "endDate":"2024-11-25T00:00:00.000Z",
    "workingDays":6,
    "reason":"Family vacation"
  }'
```

**Get Balances:**
```bash
curl -X GET http://localhost:3000/api/balance/mine \
  -b cookies.txt
```

### JavaScript Fetch Examples

**Login:**
```javascript
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@cdbl.com',
    password: 'password123'
  }),
  credentials: 'include'  // Important: include cookies
});
const data = await response.json();
```

**Approve Leave:**
```javascript
const response = await fetch(`/api/leaves/${leaveId}/approve`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    comment: 'Approved for vacation'
  }),
  credentials: 'include'
});
const result = await response.json();
```

---

## Security

### Security Best Practices

1. **Authentication:**
   - JWT tokens in HTTP-only cookies (XSS protection)
   - 7-day expiration
   - Secure flag in production (HTTPS only)

2. **Authorization:**
   - Role-based access control on all endpoints
   - Resource ownership validation
   - Self-approval prevention

3. **Input Validation:**
   - Zod schema validation on all inputs
   - SQL injection prevention via Prisma ORM
   - XSS prevention via sanitization

4. **Rate Limiting:**
   - Per-IP rate limiting on authentication endpoints
   - Exponential backoff on failed attempts

5. **Audit Logging:**
   - All sensitive operations logged
   - IP address tracking
   - Tamper-proof audit trail

### Security Headers

All API responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## Related Documentation

- **Database Schema:** [Database Schema](../03-Database-Schema.md)
- **User Roles:** [User Roles & Permissions](../04-User-Roles-and-Permissions.md)
- **Policy Rules:** [Policy Logic Reference](../Policy%20Logic/README.md)

---

**Document Version:** 2.0
**Last Updated:** January 2025
**Total Endpoints:** 35+ REST endpoints
**Authentication:** JWT via HTTP-only cookies
**Authorization:** Role-based (6 roles)
