# Payroll Integration Design Document

## Overview
This document outlines the architecture and design for integrating the CDBL Leave Management System with external payroll systems. The goal is to automate the export of leave data, calculate Leave Without Pay (LWP), and handle leave encashment.

## Data Model

### PayrollExportRecord
The core data structure for exporting payroll data.

```typescript
interface PayrollExportRecord {
  // Employee Identification
  employeeId: string;
  empCode: string;
  name: string;
  department: string;
  designation: string;

  // Period Information
  month: string; // e.g., "January"
  year: number;  // e.g., 2025
  periodStart: Date;
  periodEnd: Date;

  // Leave Summary
  totalWorkingDays: number;
  totalPresentDays: number; // Calculated: WorkingDays - UnpaidLeaves
  totalPaidLeaveDays: number;
  totalUnpaidLeaveDays: number;

  // Financial Impact
  lwpDeductionDays: number; // Days to deduct salary for
  encashmentDays: number;   // Days to pay encashment for

  // Detailed Breakdown (by Leave Type)
  breakdown: {
    [leaveType: string]: {
      days: number;
      isPaid: boolean;
    };
  };

  // Metadata
  generatedAt: Date;
  generatedBy: string; // User ID
}
```

## API Design

### 1. Generate Payroll Report
**Endpoint**: `POST /api/payroll/generate`
**Description**: Generates a payroll report for a specific month and year.

**Request Body**:
```json
{
  "month": 1, // 1-12
  "year": 2025,
  "departmentId": "optional-uuid" // If omitted, all departments
}
```

**Response**:
```json
{
  "reportId": "uuid",
  "status": "processing", // Async generation
  "message": "Report generation started"
}
```

### 2. Get Report Status/Download
**Endpoint**: `GET /api/payroll/reports/:id`
**Description**: Checks status and returns download URL if ready.

**Response**:
```json
{
  "id": "uuid",
  "status": "completed",
  "downloadUrl": "/api/payroll/download/:id",
  "summary": {
    "totalEmployees": 150,
    "totalLWP": 5,
    "totalEncashment": 2
  }
}
```

### 3. Employee Payroll Summary
**Endpoint**: `GET /api/payroll/employee/:id/summary`
**Description**: Get payroll-related leave summary for a specific employee.

**Query Params**:
- `month`: number
- `year`: number

## Calculation Logic

### Leave Without Pay (LWP)
LWP is calculated based on:
1.  **Unpaid Leave Types**: Leaves explicitly marked as unpaid (e.g., "Leave Without Pay").
2.  **Exhausted Balance**: If an employee takes paid leave (e.g., Sick Leave) beyond their balance, the excess days are treated as LWP (if policy allows negative balance, otherwise it's rejected). *Note: Current system rejects, so we primarily focus on explicit LWP.*

**Formula**:
```typescript
LWP_Days = Sum(Days of Unpaid Leave Types)
```

### Encashment
Earned Leave (EL) can be encashed based on policy.

**Formula**:
```typescript
Encashment_Amount = (Basic_Salary / 30) * Encashment_Days
```
*Note: The LMS calculates `Encashment_Days`. The actual amount calculation happens in the Payroll System, but we provide the days.*

## Integration Strategy

### Phase 1: File-Based Export
- **Formats**: CSV, Excel (.xlsx)
- **Delivery**: Download from Admin Dashboard
- **Frequency**: Monthly (before payroll processing)

### Phase 2: API Integration (Future)
- **Method**: REST API / Webhooks
- **Target Systems**: Local payroll software (custom adapters needed)

## Security
- **Access Control**: Only `HR_ADMIN` and `CEO` can access payroll data.
- **Audit Logging**: All export actions are logged in `AuditLog`.
- **Data Protection**: Export files are generated in memory or temporary storage and deleted after download.
