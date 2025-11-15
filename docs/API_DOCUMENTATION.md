# API Documentation - CDBL Leave Management System

> Version 2.0.0 | Last Updated: November 15, 2025

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Leave Management](#leave-management)
- [Approvals](#approvals)
- [Balance Management](#balance-management)
- [Holidays](#holidays)
- [Dashboard & Analytics](#dashboard--analytics)
- [User Management](#user-management)
- [Reports & Export](#reports--export)
- [Notifications](#notifications)
- [Error Handling](#error-handling)

---

## Overview

Base URL: `https://your-domain.com/api`

All API endpoints return JSON responses. Most endpoints require authentication via session cookies.

### Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Authentication

### POST `/api/login`

Authenticate user and create session.

**Request:**
```json
{
  "email": "user@cdbl.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@cdbl.com",
    "role": "EMPLOYEE"
  }
}
```

**cURL Example:**
```bash
curl -X POST https://your-domain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@cdbl.com","password":"password123"}'
```

### POST `/api/logout`

End current session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET `/api/auth/me`

Get current authenticated user.

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@cdbl.com",
  "role": "EMPLOYEE",
  "department": "Engineering"
}
```

---

## Leave Management

### GET `/api/leaves`

Retrieve leave requests (filtered by role).

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, APPROVED, etc.)
- `type` (optional): Filter by leave type
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
{
  "leaves": [
    {
      "id": 101,
      "type": "CASUAL",
      "startDate": "2025-11-20T00:00:00Z",
      "endDate": "2025-11-22T00:00:00Z",
      "workingDays": 3,
      "reason": "Personal work",
      "status": "PENDING",
      "requester": {
        "id": 5,
        "name": "Jane Smith",
        "email": "jane@cdbl.com"
      },
      "createdAt": "2025-11-15T10:30:00Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET "https://your-domain.com/api/leaves?status=PENDING" \
  -H "Cookie: session=your-session-cookie"
```

### POST `/api/leaves`

Create a new leave request.

**Request:**
```json
{
  "type": "CASUAL",
  "startDate": "2025-11-20",
  "endDate": "2025-11-22",
  "reason": "Personal work",
  "certificateUrl": null
}
```

**Response:**
```json
{
  "success": true,
  "leave": {
    "id": 101,
    "type": "CASUAL",
    "startDate": "2025-11-20T00:00:00Z",
    "endDate": "2025-11-22T00:00:00Z",
    "workingDays": 3,
    "status": "SUBMITTED"
  },
  "message": "Leave request submitted successfully"
}
```

### GET `/api/leaves/[id]`

Get details of a specific leave request.

**Response:**
```json
{
  "id": 101,
  "type": "CASUAL",
  "startDate": "2025-11-20T00:00:00Z",
  "endDate": "2025-11-22T00:00:00Z",
  "workingDays": 3,
  "reason": "Personal work",
  "status": "APPROVED",
  "requester": {
    "name": "Jane Smith",
    "email": "jane@cdbl.com"
  },
  "approvals": [
    {
      "step": 1,
      "decision": "APPROVED",
      "approver": "HR Admin",
      "decidedAt": "2025-11-16T09:00:00Z"
    }
  ]
}
```

### PATCH `/api/leaves/[id]/approve`

Approve a leave request.

**Request:**
```json
{
  "comment": "Approved with best wishes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave request approved successfully"
}
```

### PATCH `/api/leaves/[id]/reject`

Reject a leave request.

**Request:**
```json
{
  "reason": "Insufficient staffing during this period"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave request rejected"
}
```

### PATCH `/api/leaves/[id]/cancel`

Cancel an approved leave request.

**Request:**
```json
{
  "reason": "Change of plans"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave request cancelled"
}
```

### POST `/api/leaves/[id]/extend`

Request extension for existing leave.

**Request:**
```json
{
  "newEndDate": "2025-11-25",
  "reason": "Medical complications require extended rest"
}
```

**Response:**
```json
{
  "success": true,
  "extensionRequest": {
    "id": 102,
    "parentLeaveId": 101,
    "isExtension": true
  }
}
```

### POST `/api/leaves/[id]/shorten`

Shorten an approved leave (before it starts).

**Request:**
```json
{
  "newEndDate": "2025-11-21",
  "reason": "Early return to work"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave shortened successfully"
}
```

### POST `/api/leaves/[id]/partial-cancel`

Cancel part of leave after it has started.

**Request:**
```json
{
  "newEndDate": "2025-11-20",
  "reason": "Need to return to office early"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave partially cancelled"
}
```

### POST `/api/leaves/[id]/return-for-modification`

Return leave to employee for modifications.

**Request:**
```json
{
  "comment": "Please provide medical certificate"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave returned for modification"
}
```

### POST `/api/leaves/[id]/forward`

Forward leave to another approver.

**Request:**
```json
{
  "toRole": "HR_HEAD",
  "comment": "Requires HR Head approval"
}
```

### POST `/api/leaves/[id]/certificate`

Upload medical certificate.

**Request:** FormData
- `certificate`: File (PDF, JPG, PNG)

**Response:**
```json
{
  "success": true,
  "certificateUrl": "https://storage.com/certificates/abc123.pdf"
}
```

### POST `/api/leaves/[id]/fitness-certificate/approve`

Approve fitness certificate for medical leave return.

**Response:**
```json
{
  "success": true,
  "message": "Fitness certificate approved"
}
```

### POST `/api/leaves/[id]/duty-return`

Mark employee as returned to duty.

**Request:**
```json
{
  "returnDate": "2025-11-23"
}
```

---

## Approvals

### GET `/api/approvals`

Get pending approvals for current user.

**Response:**
```json
{
  "approvals": [
    {
      "id": 201,
      "leaveId": 101,
      "step": 2,
      "leave": {
        "type": "CASUAL",
        "requester": "Jane Smith",
        "startDate": "2025-11-20T00:00:00Z"
      }
    }
  ]
}
```

### GET `/api/approvals/[id]`

Get specific approval details.

### POST `/api/approvals/[id]/decision`

Make approval decision.

**Request:**
```json
{
  "decision": "APPROVED",
  "comment": "Approved"
}
```

---

## Balance Management

### GET `/api/balance/mine`

Get leave balances for current user.

**Response:**
```json
{
  "balances": {
    "EARNED": {
      "year": 2025,
      "opening": 20,
      "accrued": 24,
      "used": 10,
      "closing": 34
    },
    "CASUAL": {
      "year": 2025,
      "opening": 0,
      "accrued": 14,
      "used": 5,
      "closing": 9
    },
    "MEDICAL": {
      "year": 2025,
      "opening": 0,
      "accrued": 14,
      "used": 2,
      "closing": 12
    }
  },
  "conversions": [
    {
      "id": 1,
      "fromType": "EARNED",
      "toType": "SPECIAL",
      "amount": 5,
      "excessDays": 65,
      "appliedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/api/conversions`

Get leave type conversions.

**Response:**
```json
{
  "conversions": [
    {
      "id": 1,
      "userId": 5,
      "fromType": "EARNED",
      "toType": "SPECIAL",
      "amount": 5,
      "reason": "EL exceeded 60 days"
    }
  ]
}
```

---

## Holidays

### GET `/api/holidays`

Get all holidays.

**Query Parameters:**
- `year` (optional): Filter by year

**Response:**
```json
{
  "holidays": [
    {
      "id": 1,
      "date": "2025-12-16T00:00:00Z",
      "name": "Victory Day",
      "isOptional": false
    },
    {
      "id": 2,
      "date": "2025-12-25T00:00:00Z",
      "name": "Christmas",
      "isOptional": true
    }
  ]
}
```

### POST `/api/holidays` (Admin only)

Create new holiday.

**Request:**
```json
{
  "date": "2025-12-16",
  "name": "Victory Day",
  "isOptional": false
}
```

### PATCH `/api/holidays/[id]` (Admin only)

Update holiday.

### DELETE `/api/holidays/[id]` (Admin only)

Delete holiday.

---

## Dashboard & Analytics

### GET `/api/dashboard/analytics`

Get dashboard analytics.

**Response:**
```json
{
  "totalLeaves": 150,
  "pendingApprovals": 12,
  "approvedToday": 5,
  "rejectedThisWeek": 2,
  "leavesByType": {
    "CASUAL": 45,
    "MEDICAL": 30,
    "EARNED": 75
  }
}
```

### GET `/api/dashboard/hr-metrics`

HR-specific metrics.

**Response:**
```json
{
  "utilizationRate": 68.5,
  "avgProcessingTime": 2.3,
  "topLeaveTypes": ["EARNED", "CASUAL", "MEDICAL"]
}
```

### GET `/api/dashboard/ceo/stats`

CEO dashboard statistics.

### GET `/api/dashboard/hr-head/stats`

HR Head dashboard statistics.

### GET `/api/dashboard/hr-admin/stats`

HR Admin dashboard statistics.

### GET `/api/analytics/heatmap`

Leave heatmap data for capacity planning.

**Response:**
```json
{
  "heatmap": [
    {
      "date": "2025-11-20",
      "count": 15,
      "employees": ["John", "Jane", "Bob"]
    }
  ]
}
```

---

## User Management

### GET `/api/admin/users` (Admin only)

Get all users.

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@cdbl.com",
      "role": "EMPLOYEE",
      "department": "Engineering"
    }
  ]
}
```

### POST `/api/admin/users/create` (Admin only)

Create new user.

**Request:**
```json
{
  "name": "New Employee",
  "email": "new@cdbl.com",
  "empCode": "EMP001",
  "role": "EMPLOYEE",
  "department": "HR",
  "joinDate": "2025-11-01"
}
```

### GET `/api/admin/users/[id]`

Get user details.

### PATCH `/api/admin/users/[id]`

Update user.

### GET `/api/employees/[id]`

Get employee profile with leave stats.

---

## Reports & Export

### GET `/api/reports/analytics`

Generate analytics report.

**Query Parameters:**
- `startDate`: Report start date
- `endDate`: Report end date
- `department` (optional)
- `leaveType` (optional)

**Response:**
```json
{
  "reportData": {
    "totalLeaves": 100,
    "avgDuration": 3.5,
    "breakdown": { ... }
  }
}
```

### GET `/api/reports/export`

Export report as PDF/Excel.

**Query Parameters:**
- `format`: "pdf" | "excel"
- `startDate`
- `endDate`

**Response:** Binary file download

### GET `/api/leaves/export`

Export leave data.

---

## Notifications

### GET `/api/notifications/latest`

Get recent notifications.

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "LEAVE_APPROVED",
      "message": "Your casual leave has been approved",
      "read": false,
      "createdAt": "2025-11-15T10:00:00Z"
    }
  ]
}
```

### POST `/api/notifications/[id]/read`

Mark notification as read.

### POST `/api/notifications/read-all`

Mark all notifications as read.

---

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `BALANCE_INSUFFICIENT` | Insufficient leave balance |
| `POLICY_VIOLATION` | Policy compliance error |
| `DUPLICATE_REQUEST` | Overlapping leave dates |

### Example Error Response

```json
{
  "success": false,
  "error": "Insufficient leave balance",
  "code": "BALANCE_INSUFFICIENT",
  "details": {
    "required": 5,
    "available": 3
  }
}
```

---

## Rate Limiting

- General endpoints: 100 requests per minute
- Authentication: 10 requests per minute
- Export endpoints: 5 requests per minute

Exceeded limits return `429 Too Many Requests`.

---

## Webhooks (Future)

Webhook support for leave status changes coming in v2.1.

---

## Support

For API support, contact: dev-team@cdbl.com

---

*Last Updated: November 15, 2025*
