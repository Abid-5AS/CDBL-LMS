# Web App Form Validation Rules

> **Source of Truth**: All rules align with `/docs/Policy Logic/` documentation (Policy v2.0).

## Leave Type Validation

### CASUAL Leave (CL):

- **Maximum consecutive days**: 3 days per spell (hard limit)
- **Annual cap**: 10 days per calendar year (includes APPROVED + PENDING)
- **Holiday/Weekend restriction**: Cannot start or end on Friday, Saturday, or company holidays (hard block)
- **Advance notice**: Recommended 5 working days (soft warning only)
- **Backdating**: Not allowed (start date must be >= today)
- **Carry-forward**: No (lapses on December 31)

### MEDICAL Leave (ML):

- **Annual cap**: 14 days per calendar year (includes APPROVED + PENDING)
- **Certificate requirement**: Required if duration > 3 days (hard block)
- **Fitness certificate**: Required for ML > 7 days when returning to duty
- **Advance notice**: None required (can be submitted same-day or on rejoining day)
- **Backdating**: Allowed up to 30 days back
- **Carry-forward**: No

### EARNED Leave (EL):

- **Annual entitlement**: 24 days/year (accrual: 2 working days/month)
- **Advance notice**: ≥5 working days before start date (hard block)
  - Calculation: Counts working days only (excludes Friday, Saturday, holidays)
- **Carry-forward**: Up to 60 days maximum (opening + accrued combined)
- **Backdating**: Allowed up to 30 days back
- **Annual cap**: None (subject to accrual rate)

## Field Validation

### Start Date:

- **Required**: Yes
- **Cannot be**: Friday, Saturday, or any company holiday (hard block)
- **Minimum date**:
  - CL: Today (no backdating)
  - EL/ML: 30 days before today (allows backdating)
- **CL special rule**: Cannot touch Fri/Sat/holiday on either side
- **Cannot be**: After end date

### End Date:

- **Required**: Yes
- **Cannot be**: Friday, Saturday, or any company holiday (hard block)
- **Must be**: >= start date
- **CL special rule**: Cannot touch Fri/Sat/holiday on either side

### Date Format:

- **Display**: DD/MM/YYYY (British English format)
- **Timezone**: Asia/Dhaka (GMT+6)
- **Normalization**: All dates normalized to Dhaka midnight before validation

### Reason:

- Required (cannot be empty)
- Minimum 10 characters
- Character count displayed: "{count} / 10 characters minimum"

### Medical Certificate (when required):

- **Required**: If MEDICAL leave > 3 days (hard block, checked before other validations)
- **File types**: PDF, JPG, JPEG, PNG only (case-insensitive)
- **Maximum size**: 5 MB (5,242,880 bytes)
- **Validation**:
  - Extension check (client-side)
  - MIME type validation (server-side via `file-type` library)
  - Size validation (both client and server)
- **Storage**: Files stored in `/private/uploads/` with signed URLs (15-minute expiry)
- **Error messages**:
  - "Unsupported file type. Use PDF, JPG, or PNG."
  - "File too large (max 5 MB)."
  - "Medical certificate is required for sick leave over 3 days"
  - "File content type not allowed (PDF, JPG, PNG only)." (server-side MIME validation)

### Fitness Certificate (Return-to-Duty):

- **Required**: If MEDICAL leave > 7 days when submitting duty return
- **Policy**: Section 6.14 — "Medical leave over 7 days requires fitness certificate on return"
- **Same validation rules**: As medical certificate (PDF, JPG, PNG, max 5 MB)

## Error Message Exact Text

Use these exact strings for consistency:

### Date Validation:

- "Start date is required"
- "End date is required"
- "End date must be on or after start date"
- "Invalid date range"
- "Start date cannot be on Friday, Saturday, or a company holiday"
- "End date cannot be on Friday, Saturday, or a company holiday"
- "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead."

### Leave Type Specific:

- "Earned Leave requires at least 5 working days' advance notice"
- "Casual Leave cannot exceed 3 consecutive days per spell"
- "Casual Leave annual cap exceeded (10 days/year limit)"
- "Medical Leave annual cap exceeded (14 days/year limit)"
- "Insufficient balance for this leave type"
- "Earned Leave carry-forward cap exceeded (60 days maximum)"

### Reason Field:

- "Reason is required"
- "Reason must be at least 10 characters"

### File Upload:

- "Medical certificate is required for sick leave over 3 days"
- "Unsupported file type. Use PDF, JPG, or PNG."
- "File too large (max 5 MB)."
- "File content type not allowed (PDF, JPG, PNG only)." (server-side)
- "Fitness certificate is required for medical leave over 7 days"

## Warning Messages

### Soft Warnings (Allow Submission):

- "Casual Leave recommended 5 working days' advance notice" (soft warning)
- "Attach medical certificate for Sick Leave over 3 days"
- "This date range includes weekends/holidays which count toward your balance" (informational)

### Hard Blocks (Prevent Submission):

- "Casual Leave cannot exceed 3 consecutive days per spell"
- "Earned Leave requires at least 5 working days' advance notice"
- "Casual Leave cannot start or end on Friday, Saturday, or holidays"
- "Medical certificate is required for sick leave over 3 days"

## Rule Tips (Display in Summary Sidebar)

### CASUAL:

- "Max 3 consecutive days per spell"
- "10 days/year annual limit"
- "Cannot touch Fri/Sat/holidays"
- "No backdating allowed"

### MEDICAL:

- "> 3 days requires certificate"
- "Fitness cert required if > 7 days on return"
- "14 days/year annual limit"
- "Backdating allowed up to 30 days"
- "No advance notice required"

### EARNED:

- "≥5 working days advance notice"
- "24 days/year (2 days/month accrual)"
- "Carry-forward up to 60 days"
- "Backdating allowed up to 30 days"

## Leave Duration Calculation

- **Method**: Inclusive calendar days (all days count, including weekends/holidays)
- **Formula**: `(endDate - startDate) + 1` calendar days
- **Note**: Weekends and holidays **inside** the range count toward leave balance

## Working Days vs Calendar Days

- **Calendar Days** (for leave duration): All days inclusive, weekends/holidays count
- **Working Days** (for notice calculation): Excludes Friday, Saturday, and company holidays
- **EL Notice**: Uses working days (≥5 working days before start)
- **CL Warning**: Uses working days (recommends 5 working days)
