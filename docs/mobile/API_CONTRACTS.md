# API Contracts — CDBL iOS App

**Version**: 1.0  
**Last Updated**: 2025-01-30  
**Base URL**: `https://lms.cdbl.com.bd` (TBD)

---

## 📋 Overview

This document defines all API endpoints the iOS app must interact with, including request/response formats, authentication, and error handling.

**Status**: All endpoints are **NOT YET IMPLEMENTED** in the app.

---

## 🔐 Authentication

### Headers

All authenticated requests require:

```
Authorization: Bearer <sessionToken>
Content-Type: application/json
X-Device-ID: <deviceId>
X-Platform: iOS
```

### Session Token

- **Type**: JWT
- **Lifetime**: 7 days
- **Refresh**: Via `POST /api/mobile/refresh`
- **Scope**: Device-bound, limited capabilities

---

## 📊 API Endpoints

### 1. Mobile Pairing

**Purpose**: Pair iOS device with desktop web account

#### `POST /api/mobile/pair`

**Request**:

```json
{
  "pairToken": "abc123xyz...",
  "devicePublicKey": "base64-encoded-public-key",
  "deviceInfo": {
    "model": "iPhone 15 Pro",
    "osVersion": "17.1",
    "appVersion": "1.0"
  }
}
```

**Response** (200 OK):

```json
{
  "sessionToken": "eyJhbGc...",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2025-02-06T12:00:00Z",
  "refreshToken": "rt_abc123..."
}
```

**Errors**:

- `401` - Token expired or invalid
- `403` - Device already paired
- `429` - Too many pairing attempts

---

### 2. Balance

**Purpose**: Fetch employee leave balances

#### `GET /api/balance/mine`

**Request**: No body

**Response** (200 OK):

```json
{
  "year": 2025,
  "CASUAL": 10,
  "MEDICAL": 14,
  "EARNED": 45,
  "lastUpdated": "2025-01-30T10:00:00Z"
}
```

**Errors**:

- `401` - Unauthorized
- `403` - Forbidden

**Caching**: Client should cache for 24 hours

---

### 3. Leave Requests

**Purpose**: Get employee's leave history

#### `GET /api/leaves`

**Query Parameters**:

```
?status=PENDING&type=CASUAL&limit=50&offset=0
```

**Response** (200 OK):

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "CASUAL",
      "startDate": "2025-02-15T00:00:00Z",
      "endDate": "2025-02-17T00:00:00Z",
      "workingDays": 3,
      "reason": "Family event",
      "status": "APPROVED",
      "needsCertificate": false,
      "fitnessCertificateUrl": null,
      "policyVersion": "v2.0",
      "createdAt": "2025-01-20T09:00:00Z",
      "approvals": [
        {
          "role": "DEPT_HEAD",
          "status": "APPROVED",
          "step": 1,
          "actedAt": "2025-01-21T10:00:00Z",
          "remarks": "Approved"
        }
      ]
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**Errors**:

- `401` - Unauthorized
- `400` - Invalid query parameters

---

**Purpose**: Submit new leave request

#### `POST /api/leaves`

**Request**:

```json
{
  "type": "MEDICAL",
  "startDate": "2025-02-01T00:00:00Z",
  "endDate": "2025-02-05T00:00:00Z",
  "workingDays": 5,
  "reason": "Medical treatment",
  "needsCertificate": true,
  "certificateUrl": "https://lms.cdbl.com.bd/api/uploads/abc123.pdf"
}
```

**Response** (201 Created):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "type": "MEDICAL",
  "startDate": "2025-02-01T00:00:00Z",
  "endDate": "2025-02-05T00:00:00Z",
  "workingDays": 5,
  "reason": "Medical treatment",
  "status": "SUBMITTED",
  "needsCertificate": true,
  "fitnessCertificateUrl": null,
  "policyVersion": "v2.0",
  "createdAt": "2025-01-30T10:00:00Z"
}
```

**Errors**:

- `400` - Validation errors (see Error Codes below)
- `401` - Unauthorized
- `422` - Policy violation

---

**Purpose**: Get single leave request details

#### `GET /api/leaves/{id}`

**Response** (200 OK): Same as POST response with full approval history

**Errors**:

- `401` - Unauthorized
- `404` - Not found

---

**Purpose**: Cancel pending leave request

#### `PATCH /api/leaves/{id}/cancel`

**Request**:

```json
{
  "reason": "Plans changed"
}
```

**Response** (200 OK):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "CANCELLED",
  "updatedAt": "2025-01-30T11:00:00Z"
}
```

**Errors**:

- `400` - `cannot_cancel_now` (status not PENDING/SUBMITTED)
- `401` - Unauthorized
- `403` - Cannot cancel approved leave
- `404` - Not found

---

### 4. Holidays

**Purpose**: Fetch company holidays for date validation

#### `GET /api/holidays`

**Query Parameters**:

```
?year=2025
```

**Response** (200 OK):

```json
{
  "holidays": [
    {
      "date": "2025-01-01",
      "name": "New Year's Day",
      "type": "PUBLIC_HOLIDAY"
    },
    {
      "date": "2025-12-16",
      "name": "Victory Day",
      "type": "PUBLIC_HOLIDAY"
    }
  ],
  "year": 2025
}
```

**Caching**: Client should cache for 1 year

---

### 5. File Upload

**Purpose**: Upload medical certificate or fitness certificate

#### `POST /api/leaves/{id}/certificate`

**Request**: `multipart/form-data`

```
file: [binary PDF/JPG/PNG]
type: "medical" | "fitness"
```

**Response** (200 OK):

```json
{
  "url": "https://lms.cdbl.com.bd/api/uploads/abc123.pdf",
  "signedUrl": "https://lms.cdbl.com.bd/api/uploads/abc123.pdf?token=xyz...",
  "expiresAt": "2025-01-30T10:15:00Z"
}
```

**Errors**:

- `400` - Invalid file type or size
- `413` - File too large (max 5 MB)
- `401` - Unauthorized

---

### 6. Notifications (Future)

**Purpose**: Push notifications for status updates

#### `GET /api/notifications/latest`

**Response** (200 OK):

```json
{
  "notifications": [
    {
      "id": "456",
      "type": "LEAVE_APPROVED",
      "title": "Leave Approved",
      "message": "Your casual leave request has been approved.",
      "targetId": "123e4567-e89b-12d3-a456-426614174000",
      "read": false,
      "createdAt": "2025-01-30T09:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

---

## ❌ Error Response Format

All error responses follow this structure:

```json
{
  "error": "el_insufficient_notice",
  "message": "Earned Leave requires at least 5 working days advance notice.",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-30T10:00:00Z",
  "required": 5,
  "provided": 2
}
```

### Error Codes Reference

| Code | Message | Status |
|------|---------|--------|
| `unauthorized` | You are not authorized | 401 |
| `forbidden` | You don't have permission | 403 |
| `not_found` | Resource not found | 404 |
| `invalid_dates` | Invalid date range | 400 |
| `invalid_input` | Invalid input provided | 400 |
| `el_insufficient_notice` | EL requires ≥5 working days | 400 |
| `cl_exceeds_consecutive_limit` | CL max 3 consecutive | 400 |
| `cl_cannot_touch_holiday` | CL cannot touch Fri/Sat/holiday | 400 |
| `cl_annual_cap_exceeded` | CL 10 days/year exceeded | 400 |
| `ml_annual_cap_exceeded` | ML 14 days/year exceeded | 400 |
| `medical_certificate_required` | Certificate required if ML > 3 days | 400 |
| `fitness_certificate_required` | Fitness cert required if ML > 7 days | 400 |
| `insufficient_balance` | Not enough leave balance | 400 |
| `cannot_cancel_now` | Cannot cancel at this stage | 400 |
| `unsupported_file_type` | Use PDF, JPG, or PNG | 400 |
| `file_too_large` | Max 5 MB | 413 |
| `too_many_requests` | Rate limit exceeded | 429 |
| `internal_server_error` | Server error | 500 |

**Complete mapping**: See `lib/errors.ts` in web app

---

## ✅ Client-Side Validation Checklist

The iOS app must validate **before** API calls to improve UX:

### Date Validation

| Rule | Status | Location |
|------|--------|----------|
| Start ≤ End | ✅ Implemented | `LeaveRequest.validate()` |
| Cannot be Fri/Sat | ⚠️ Partial | `isWeekend()` check |
| Cannot be holiday | ❌ Missing | Need holiday cache |
| Backdate allowed | ✅ Implemented | `minimumSelectableDate()` |
| Backdate window | ⚠️ Partial | Need API to validate |

### Leave Type Validation

| Rule | Status | Implementation |
|------|--------|----------------|
| CL max 3 consecutive | ✅ Implemented | Line 272 in LeaveRequest.swift |
| CL cannot touch holiday | ❌ Missing | Need holiday awareness |
| EL ≥5 working days notice | ❌ Wrong (shows 15) | Line 286 needs fix |
| ML certificate >3 days | ✅ Implemented | Line 277 |

### Balance Validation

| Rule | Status | Implementation |
|------|--------|----------------|
| Sufficient balance | ⚠️ Mock only | `currentBalance` from mock |
| Annual caps | ❌ Missing | Need API |
| Carry-forward cap | ❌ Missing | Need API |

### File Validation

| Rule | Status | Implementation |
|------|--------|----------------|
| File type (PDF/JPG/PNG) | ⚠️ Partial | DocumentPicker limits types |
| File size ≤5MB | ❌ Missing | No size check |

**Legend**: ✅ = Complete | ⚠️ = Partial | ❌ = Missing

---

## 🔄 Offline Queue Strategy

When offline, queue all write operations:

| Operation | Queue? | Priority |
|-----------|--------|----------|
| Create leave | ✅ Yes | High |
| Cancel leave | ✅ Yes | High |
| Upload certificate | ⚠️ Maybe | Medium |
| View balance | ❌ No | N/A |
| View history | ❌ No | N/A |
| Fetch holidays | ❌ No | N/A |

**Queue Model**:

```swift
struct QueuedAction {
    let id: UUID
    let type: ActionType
    let payload: Data
    let createdAt: Date
    let retryCount: Int
    let status: QueueStatus
}

enum QueueStatus {
    case pending
    case inProgress
    case completed
    case failed
}
```

---

## 📡 Retry Strategy

### Exponential Backoff

```
Attempt 1: Immediate
Attempt 2: +1 second
Attempt 3: +2 seconds
Attempt 4: +4 seconds
Attempt 5: +8 seconds
Max: 10 attempts or 5 minutes
```

**Implementation**:

```swift
func retry<T>(
    maxAttempts: Int = 10,
    operation: @escaping () async throws -> T
) async throws -> T {
    var attempt = 0
    while attempt < maxAttempts {
        do {
            return try await operation()
        } catch {
            if attempt == maxAttempts - 1 { throw error }
            
            let delay = pow(2.0, Double(attempt))
            try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            attempt += 1
        }
    }
    throw RetryError.maxAttemptsExceeded
}
```

---

## 🧪 Mock Data for Testing

When API is unavailable, use mock data:

```swift
class MockAPIClient: APIClientProtocol {
    func getBalances() async throws -> LeaveBalance {
        try await Task.sleep(nanoseconds: 500_000_000) // Simulate network
        return LeaveBalance(year: 2025, CASUAL: 10, MEDICAL: 14, EARNED: 45)
    }
    
    func createLeave(_ request: LeaveRequest) async throws -> LeaveRequest {
        try await Task.sleep(nanoseconds: 1_000_000_000)
        return request // Return as-is for testing
    }
}
```

---

## 📋 Implementation Checklist

- [ ] Implement `APIClient` with URLSession
- [ ] Add request/response serialization
- [ ] Map all error codes
- [ ] Implement retry logic
- [ ] Add offline queue
- [ ] Cache balances & holidays
- [ ] Token refresh flow
- [ ] File upload with progress
- [ ] Mock API for development

---

**Document Status**: ✅ Complete (Design Phase)  
**Implementation Status**: ❌ Not Started  
**Last Reviewed**: 2025-01-30

