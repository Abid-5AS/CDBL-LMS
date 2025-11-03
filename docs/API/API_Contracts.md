# CDBL Leave Management System - API Contracts

## Overview

All API endpoints follow RESTful conventions using Next.js 16 App Router API routes. Responses are JSON format with standard HTTP status codes.

**Base URL**: `/api`

**Authentication**: JWT token stored in HTTP-only cookie (`jwt`) + additional user info cookies

**Response Format**:
```json
{
  "ok": true,
  "data": { ... },
  "error": "error_code" // on error
}
```

---

## Authentication APIs

### POST /api/login

**Purpose**: User authentication

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response** (200):
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "EMPLOYEE"
  }
}
```

**Errors**:
- `400`: Missing email or password
- `401`: Invalid credentials or account not configured
- `429`: Too many login attempts (rate limited)

**Cookies Set**:
- `jwt`: HTTP-only JWT token
- `auth_user_email`: User email
- `auth_user_name`: User name
- `auth_user_role`: User role

**Location**: `app/api/login/route.ts`

---

### POST /api/logout

**Purpose**: User logout

**Request**: No body required

**Response** (200):
```json
{
  "ok": true
}
```

**Cookies Cleared**: All authentication cookies

**Location**: `app/api/logout/route.ts`

---

### GET /api/auth/me

**Purpose**: Get current authenticated user

**Response** (200):
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "department": "IT"
  }
}
```

**Errors**:
- `401`: Not authenticated

**Location**: `app/api/auth/me/route.ts`

---

### GET /api/auth/users

**Purpose**: List all users (Admin only)

**Response** (200):
```json
{
  "ok": true,
  "users": [...]
}
```

**Location**: `app/api/auth/users/route.ts`

---

## Leave APIs

### GET /api/leaves

**Purpose**: Get leave requests

**Query Parameters**:
- `mine` (optional): Filter to current user's leaves
- `type` (optional): Filter by leave type
- `status` (optional): Filter by status
- `year` (optional): Filter by year

**Response** (200):
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
      "approvals": [...]
    }
  ]
}
```

**Location**: `app/api/leaves/route.ts`

---

### POST /api/leaves

**Purpose**: Create leave request

**Request Body** (JSON or FormData):
```json
{
  "type": "EARNED" | "CASUAL" | "MEDICAL" | ...,
  "startDate": "2024-10-23T00:00:00.000Z",
  "endDate": "2024-10-28T00:00:00.000Z",
  "reason": "Family vacation",
  "workingDays": 6,
  "needsCertificate": false
}
```

**FormData** (if certificate provided):
- All above fields as form fields
- `certificate`: File (PDF, JPG, PNG, max 5MB)

**Response** (200):
```json
{
  "ok": true,
  "id": 1,
  "warnings": {
    "clShortNotice": true
  }
}
```

**Errors**:
- `400`: Validation errors (see error codes below)
- `401`: Unauthorized

**Error Codes**:
- `invalid_dates`: Date range invalid
- `el_insufficient_notice`: EL requires 15 days notice
- `cl_exceeds_consecutive_limit`: CL > 3 days
- `medical_certificate_required`: ML > 3 days without certificate
- `backdate_disallowed_by_policy`: Backdate not allowed
- `backdate_window_exceeded`: Backdate > 30 days
- `cl_cannot_touch_holiday`: CL touches holiday/weekend
- `cl_annual_cap_exceeded`: CL annual cap exceeded
- `ml_annual_cap_exceeded`: ML annual cap exceeded
- `el_carry_cap_exceeded`: EL carry-forward cap exceeded
- `insufficient_balance`: Insufficient leave balance
- `unsupported_file_type`: Invalid file type
- `file_too_large`: File > 5MB

**Location**: `app/api/leaves/route.ts`

---

### GET /api/leaves/[id]

**Purpose**: Get single leave request details

**Response** (200):
```json
{
  "id": 1,
  "type": "EARNED",
  "startDate": "...",
  "endDate": "...",
  "workingDays": 6,
  "reason": "...",
  "status": "PENDING",
  "approvals": [...],
  "requester": {...}
}
```

**Errors**:
- `404`: Leave not found

**Location**: `app/api/leaves/[id]/route.ts` (implied, verify if exists)

---

### PATCH /api/leaves/[id]

**Purpose**: Cancel leave request

**Request**: No body required

**Response** (200):
```json
{
  "ok": true,
  "id": 1
}
```

**Errors**:
- `400`: `cannot_cancel_now` (status not PENDING/SUBMITTED)
- `404`: Leave not found

**Location**: `app/api/leaves/[id]/route.ts`

---

### POST /api/leaves/[id]/approve

**Purpose**: Approve leave request

**Request Body**:
```json
{
  "comment": "Optional comment"
}
```

**Response** (200):
```json
{
  "ok": true,
  "status": "APPROVED"
}
```

**Errors**:
- `400`: `invalid_status` (not SUBMITTED/PENDING)
- `403`: `self_approval_disallowed`, `forbidden`
- `404`: Leave not found

**Requirements**:
- Role: HR_HEAD or CEO
- Cannot approve own requests

**Location**: `app/api/leaves/[id]/approve/route.ts`

---

### POST /api/leaves/[id]/reject

**Purpose**: Reject leave request

**Request Body**:
```json
{
  "comment": "Optional comment"
}
```

**Response** (200):
```json
{
  "ok": true,
  "status": "REJECTED"
}
```

**Errors**: Same as approve endpoint

**Location**: `app/api/leaves/[id]/reject/route.ts`

---

### POST /api/leaves/[id]/forward

**Purpose**: Forward leave request to next approver

**Request**: No body required (automatically forwards to next role in chain)

**Response** (200):
```json
{
  "ok": true,
  "status": "PENDING",
  "forwardedTo": "DEPT_HEAD"
}
```

**Errors**:
- `400`: `no_next_role`, `invalid_forward_target`, `invalid_status`
- `403`: `forbidden`

**Requirements**:
- Role: HR_ADMIN or DEPT_HEAD
- Automatically forwards to next role in approval chain

**Location**: `app/api/leaves/[id]/forward/route.ts`

---

## Approval APIs

### GET /api/approvals

**Purpose**: Get pending approvals for current user

**Response** (200):
```json
{
  "items": [
    {
      "id": 1,
      "type": "EARNED",
      "requester": {...},
      "startDate": "...",
      "endDate": "...",
      "status": "PENDING"
    }
  ]
}
```

**Location**: `app/api/approvals/route.ts`

---

### GET /api/approvals/[id]

**Purpose**: Get single approval details

**Location**: `app/api/approvals/[id]/route.ts`

---

### POST /api/approvals/[id]/decision

**Purpose**: Make approval decision (legacy endpoint, prefer leave-specific endpoints)

**Request Body**:
```json
{
  "action": "approve" | "reject",
  "comment": "Optional comment"
}
```

**Location**: `app/api/approvals/[id]/decision/route.ts`

---

## Balance APIs

### GET /api/balance/mine

**Purpose**: Get current user's leave balances

**Response** (200):
```json
{
  "balances": {
    "EARNED": {
      "total": 20,
      "used": 5,
      "remaining": 15
    },
    "CASUAL": {
      "total": 10,
      "used": 3,
      "remaining": 7
    },
    "MEDICAL": {
      "total": 14,
      "used": 0,
      "remaining": 14
    }
  }
}
```

**Location**: `app/api/balance/mine/route.ts`

---

## Holiday APIs

### GET /api/holidays

**Purpose**: Get list of holidays

**Query Parameters**:
- `year` (optional): Filter by year

**Response** (200):
```json
{
  "holidays": [
    {
      "id": 1,
      "date": "2024-12-16T00:00:00.000Z",
      "name": "Victory Day",
      "isOptional": false
    }
  ]
}
```

**Location**: `app/api/holidays/route.ts`

---

### POST /api/holidays

**Purpose**: Create holiday (Admin only)

**Request Body**:
```json
{
  "date": "2024-12-16T00:00:00.000Z",
  "name": "Victory Day",
  "isOptional": false
}
```

**Response** (200):
```json
{
  "ok": true,
  "id": 1
}
```

**Location**: `app/api/holidays/route.ts`

---

### GET /api/holidays/[id]

**Purpose**: Get single holiday

**Location**: `app/api/holidays/[id]/route.ts`

---

### PATCH /api/holidays/[id]

**Purpose**: Update holiday (Admin only)

**Location**: `app/api/holidays/[id]/route.ts`

---

### DELETE /api/holidays/[id]

**Purpose**: Delete holiday (Admin only)

**Location**: `app/api/holidays/[id]/route.ts`

---

## Employee APIs

### GET /api/employees/[id]

**Purpose**: Get employee details

**Response** (200):
```json
{
  "id": 1,
  "name": "Employee Name",
  "email": "employee@example.com",
  "role": "EMPLOYEE",
  "department": "IT",
  "leaves": [...],
  "balances": [...]
}
```

**Location**: `app/api/employees/[id]/route.ts`

---

## Dashboard APIs

### GET /api/dashboard/analytics

**Purpose**: Get dashboard analytics

**Query Parameters**:
- `year` (optional): Filter by year

**Response** (200):
```json
{
  "monthlyUsage": [...],
  "typeDistribution": {...},
  "trends": [...]
}
```

**Location**: `app/api/dashboard/analytics/route.ts`

---

### GET /api/dashboard/alerts

**Purpose**: Get dashboard alerts and reminders

**Response** (200):
```json
{
  "alerts": [...]
}
```

**Location**: `app/api/dashboard/alerts/route.ts`

---

### GET /api/dashboard/recommendations

**Purpose**: Get leave recommendations

**Response** (200):
```json
{
  "recommendations": [...]
}
```

**Location**: `app/api/dashboard/recommendations/route.ts`

---

## Admin APIs

### GET /api/admin/users

**Purpose**: List users (Admin only)

**Response** (200):
```json
{
  "users": [...]
}
```

**Location**: `app/api/admin/users/route.ts`

---

### POST /api/admin/users/create

**Purpose**: Create new user (Admin only)

**Request Body**:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password",
  "role": "EMPLOYEE",
  "department": "IT",
  "empCode": "EMP001"
}
```

**Location**: `app/api/admin/users/create/route.ts`

---

### GET /api/admin/users/[id]

**Purpose**: Get user details (Admin only)

**Location**: `app/api/admin/users/[id]/route.ts`

---

### PATCH /api/admin/users/[id]

**Purpose**: Update user (Admin only)

**Location**: `app/api/admin/users/[id]/route.ts`

---

### GET /api/admin/logs

**Purpose**: Get audit logs (Admin only)

**Query Parameters**:
- `limit` (optional): Number of logs
- `offset` (optional): Pagination offset

**Response** (200):
```json
{
  "logs": [
    {
      "id": 1,
      "actorEmail": "admin@example.com",
      "action": "LEAVE_APPROVE",
      "targetEmail": "employee@example.com",
      "details": {...},
      "createdAt": "..."
    }
  ]
}
```

**Location**: `app/api/admin/logs/route.ts`

---

### GET /api/admin/policies

**Purpose**: Get policy configurations (Admin only)

**Location**: `app/api/admin/policies/route.ts`

---

### PATCH /api/admin/policies/[id]

**Purpose**: Update policy configuration (Admin only)

**Location**: `app/api/admin/policies/[id]/route.ts`

---

## Compliance APIs

### GET /api/compliance/validate

**Purpose**: Validate policy compliance (HR_HEAD, CEO only)

**Response** (200):
```json
{
  "checks": [
    {
      "rule": "Casual Leave Annual Cap",
      "status": "pass" | "warning" | "fail",
      "message": "...",
      "details": {...}
    }
  ]
}
```

**Location**: `app/api/compliance/validate/route.ts`

---

## Policy APIs

### GET /api/policy

**Purpose**: Get active policy settings

**Response** (200):
```json
{
  "version": "v1.1",
  "settings": {...}
}
```

**Location**: `app/api/policy/route.ts`

---

## Notification APIs

### GET /api/notifications/latest

**Purpose**: Get latest notifications

**Response** (200):
```json
{
  "notifications": [...]
}
```

**Location**: `app/api/notifications/latest/route.ts`

---

## Development APIs

### POST /api/dev/seed

**Purpose**: Seed database with demo data (Development only)

**Response** (200):
```json
{
  "ok": true,
  "message": "Database seeded"
}
```

**Location**: `app/api/dev/seed/route.ts`

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "error_code",
  "message": "Human readable message",
  "details": {...} // optional
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "forbidden",
  "message": "You cannot perform this action"
}
```

### 404 Not Found
```json
{
  "error": "not_found"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

**Rate Limited Endpoints**:
- `POST /api/login`: Rate limited per IP address

**Implementation**: Via `lib/rateLimit.ts`

**Response** (429):
```json
{
  "error": "Too many login attempts. Please try again later."
}
```

---

## Caching

**All API Routes**: Use `export const cache = "no-store"` for dynamic data

**No Caching**: All endpoints return fresh data (no cache headers)

---

## Related Documentation

- **API Reference Details**: See individual route files in `app/api/`
- **Error Codes**: [System Messages](./../10-System-Messages-and-Error-Handling.md)
- **Policy Rules**: [Policy Logic Reference](./../Policy%20Logic/README.md)

---

**Document Version**: 1.0  
**Last Updated**: Current  
**Total Endpoints**: 30+ endpoints  
**Authentication**: JWT via HTTP-only cookies

