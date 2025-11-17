# Policy Settings (v1.1)

## Policy Version

**Current Version**: v1.1  
**Location**: `lib/policy.ts`  
**Stored In**: Each `LeaveRequest.policyVersion` field

---

## Core Policy Constants

### Leave Entitlements

```typescript
accrual: {
  EL_PER_YEAR: 20,    // Earned Leave: 20 days/year
  CL_PER_YEAR: 10,    // Casual Leave: 10 days/year
  ML_PER_YEAR: 14     // Medical Leave: 14 days/year
}
```

### Earned Leave (EL) Settings

- **Annual Entitlement**: 20 days/year
- **Monthly Accrual**: 2 days/month (`elAccrualPerMonth: 2`)
- **Carry Forward**: Enabled (`carryForward.EL: true`)
- **Carry Forward Cap**: 60 days (`carryForwardCap.EL: 60`)
- **Advance Notice**: 15 days minimum (`elMinNoticeDays: 15`) - **Hard requirement**
- **Backdate Allowed**: Yes (`allowBackdate.EL: true`)
- **Backdate Limit**: 30 days (`maxBackdateDays.EL: 30`)

### Casual Leave (CL) Settings

- **Annual Entitlement**: 10 days/year
- **Carry Forward**: Disabled (no carry forward)
- **Consecutive Limit**: Maximum 3 days per spell (`clMaxConsecutiveDays: 3`) - **Hard block**
- **Advance Notice**: 5 days warning (`clMinNoticeDays: 5`) - **Soft warning only**
- **Backdate Allowed**: No (`allowBackdate.CL: false`) - **Hard block**
- **Holiday/Weekend Adjacency**: Not allowed - **Hard block**

### Medical Leave (ML) Settings

- **Annual Entitlement**: 14 days/year
- **Carry Forward**: Disabled (no carry forward)
- **Medical Certificate**: Required when > 3 days (`needsMedicalCertificate`)
- **Backdate Allowed**: Yes (`allowBackdate.ML: true`)
- **Backdate Limit**: 30 days (`maxBackdateDays.ML: 30`)
- **Same-Day Submission**: Allowed (can submit on day of rejoining)

---

## Organization Settings (Configurable)

**Location**: `OrgSettings` table (key: `allowBackdate`)

### Backdate Settings

Configurable via `lib/org-settings.ts`:

```typescript
allowBackdate: {
  EL: "ask",   // "ask" = show confirmation modal, true/false = allow/deny
  CL: false,   // Hard block (cannot be changed)
  ML: true     // Always allowed
}
```

**Default Values** (set in `initDefaultOrgSettings()`):
- **EL**: `"ask"` - Shows confirmation modal before allowing backdate
- **CL**: `false` - Backdating not allowed (policy enforced)
- **ML**: `true` - Backdating allowed up to 30 days

**Note**: EL backdate set to `"ask"` due to source conflict in policy documentation. Confirm with HR before production go-live.

---

## Date & Time Rules

### Weekend Handling
- **Weekends**: Friday and Saturday (non-working days)
- **In Leave Period**: Weekends **count** toward leave balance
- **Start/End Dates**: Cannot be Friday, Saturday, or holidays

### Holiday Handling
- **Holidays**: Stored in `Holiday` table
- **In Leave Period**: Holidays **count** toward leave balance
- **Start/End Dates**: Cannot be holidays
- **CL Restriction**: Casual Leave cannot touch holidays or weekends (must use EL instead)

### Date Calculation
- **Working Days**: Calculated as inclusive calendar days (`workingDays` field)
- **Formula**: `(endDate - startDate) + 1` (inclusive)
- **Includes**: All days in range including weekends and holidays

---

## Validation Rules Summary

### Hard Blocks (Prevent Submission)
1. EL advance notice < 15 days
2. CL consecutive days > 3
3. CL annual cap exceeded (>10 days/year)
4. ML annual cap exceeded (>14 days/year)
5. CL backdate attempted
6. CL touching holiday/weekend
7. EL carry-forward cap exceeded (>60 days)
8. ML > 3 days without certificate
9. Insufficient balance for leave type

### Soft Warnings (Allow Submission)
1. CL advance notice < 5 days (shows warning, allows submit)

### Conditional Requirements
1. Medical certificate: Required when ML > 3 days
2. EL backdate confirmation: Modal confirmation when `allowBackdate.EL === "ask"`

---

## Policy Configuration Files

### Primary Configuration
- **`lib/policy.ts`**: Core policy constants (version v1.1)
  - Leave entitlements
  - Carry-forward rules
  - Notice requirements
  - Consecutive day limits
  - Accrual rates

### Organization Settings
- **`lib/org-settings.ts`**: Configurable settings via database
  - Backdate permissions
  - Policy overrides (future)

### Database Settings
- **`OrgSettings` table**: Persistent organization-wide settings
  - Backdate configuration
  - Future policy customizations

---

## Related Documentation

- **Policy Implementation**: [Policy Logic Reference](./Policy%20Logic/README.md)
- **Policy Source**: [LeavePolicy_CDBL.md](./LeavePolicy_CDBL.md)
- **Validation Rules**: [Validation_Rules.md](./Validation_Rules.md)
- **Code Location**: `lib/policy.ts`, `lib/org-settings.ts`
