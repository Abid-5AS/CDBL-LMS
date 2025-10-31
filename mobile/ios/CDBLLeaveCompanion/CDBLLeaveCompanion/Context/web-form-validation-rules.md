# Web App Form Validation Rules

## Leave Type Validation

### CASUAL Leave:
- Maximum 7 consecutive days
- Must retain 5 days balance
- No backdating (start date >= today)

### MEDICAL Leave:
- Certificate required if > 3 days
- Backdating allowed up to 30 days
- No advance notice requirement

### EARNED Leave:
- Submit at least 15 days in advance
- Balance carries forward up to 60 days
- Backdating allowed up to 30 days

## Field Validation

### Start Date:
- Required
- Must be >= minimum selectable date (based on leave type)
- Cannot be after end date

### End Date:
- Required
- Must be >= start date
- Cannot be before start date

### Reason:
- Required (cannot be empty)
- Minimum 10 characters
- Character count displayed: "{count} / 10 characters minimum"

### Medical Certificate (when required):
- Required if MEDICAL leave > 3 days
- File types: PDF, JPG, JPEG, PNG only
- Maximum size: 5 MB
- Error messages:
  - "Unsupported file type. Use PDF, JPG, or PNG."
  - "File too large (max 5 MB)."
  - "Medical certificate is required for sick leave over 3 days"

## Error Message Exact Text

Use these exact strings for consistency:

- "Start date is required"
- "End date is required"
- "End date must be on or after start date"
- "Invalid date range"
- "Reason is required"
- "Reason must be at least 10 characters"
- "Medical certificate is required for sick leave over 3 days"
- "Unsupported file type. Use PDF, JPG, or PNG."
- "File too large (max 5 MB)."
- "Insufficient balance for this leave type"

## Warning Messages

- "Casual Leave cannot exceed 7 consecutive days."
- "Earned Leave requires 15 days' advance notice."
- "Attach medical certificate for Sick Leave over 3 days."

## Rule Tips (Display in Summary Sidebar)

### CASUAL:
- "Max 7 consecutive days"
- "Must retain 5 days balance"

### MEDICAL:
- "> 3 days requires certificate"
- "Backdating allowed up to 30 days"

### EARNED:
- "Submit at least 15 days in advance"
- "Balance carries forward up to 60 days"

