# API Contracts (App Router / Next.js)

All responses: JSON with `{ success: boolean, data?: any, error?: { code, message } }`

Auth:
- Cookie bundle: `jwt` (HTTP-only) + `auth_user_email`/`auth_user_name`/`auth_user_role`.

## POST /api/leaves/apply
Create a leave request.  
Body:
```
{
  type: "EL"|"CL"|"ML"|"EOL_WP"|"EOL_WOP"|"MAT"|"PAT"|"STUDY"|"DISABILITY"|"QUAR",
  startDate: string (ISO),
  endDate: string (ISO),
  reason: string,
  contactAddress?: string,
  contactPhone?: string,
  substitute?: string (userId),
  attachments?: { kind: "MEDICAL_CERT"|"PRESCRIPTION"|"QUARANTINE_CERT"|"OTHER", url:string, fileName:string }[]
}
```
Validations:
- Backdate allowed: EL, ML; not allowed: CL.
- CL notice < 5 days -> 200 + `{ warning: "CL should be submitted >= 5 days early" }` but still accepts if balance/rules OK.
- ML > 3 days requires `hasMedicalCertificate: true`; otherwise 400.
Returns: `{ success, data: { leave }, warning?: string }`

## GET /api/leaves?mine=1|0&type?=CL&status?=pending|approved|rejected&year?=2025
List leaves (default: current user). HR/Admin can query org-wide with filters.  
Returns: `{ success, data: { items, total } }`

## GET /api/leaves/:id
- Returns a single leave with full detail + timeline.

## POST /api/leaves/:id/cancel
- Auth: employee who owns the leave; status must be PENDING.
- Response: `{ success: true, leave: ... }`

## GET /api/approvals
- Auth: HR Admin.
- Returns pending leave requests awaiting HR action.

## POST /api/approvals/:id/decision
Body: `{ action: "approve"|"reject", comment?: string }`  
Role: HR Admin.  
Effects: Upserts an approval record and updates `LeaveRequest.status`.  
Returns: `{ ok: true, status: "APPROVED"|"REJECTED" }`

## POST /api/return-to-duty
Marks return for ML (and any tracked types).  
Body: `{ leaveId: string, actualReturnDate: string(ISO), fitnessAttached?: boolean }`  
Rules: enforce 6.14(c)/(d) waiver logic.  
Returns: updated leave.

## GET /api/policy
Fetch active settings (year).

## POST /api/policy
Update settings (HR Admin / System Admin).  
Body: shape of `/docs/Data_Models.md` `policy_settings`.

Errors:
- 400 VALIDATION_FAILED
- 403 FORBIDDEN
- 404 NOT_FOUND
- 409 CONFLICT (balance or rule)
- 500 SERVER_ERROR
