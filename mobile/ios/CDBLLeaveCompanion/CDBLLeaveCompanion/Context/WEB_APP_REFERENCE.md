# Web App Reference - CDBL Leave Management System

> **Source of Truth**: All business rules align with `/docs/Policy Logic/` documentation (Policy v2.0), which is the ultimate source of truth for leave management rules.

This document provides context about the web application to ensure iOS app consistency.

## Web App Technology Stack

- **Framework**: Next.js 16
- **UI Library**: React with Tailwind CSS
- **Component System**: shadcn/ui
- **Database**: MySQL with Prisma ORM
- **Styling**: Tailwind CSS with custom design tokens

## Leave Form Implementation

The web app's leave application form is located at: `app/leaves/apply/_components/apply-leave-form.tsx`

### Key Features from Web Form:

1. **Leave Types**: Only three types are supported:
   - CASUAL ("Casual Leave")
   - MEDICAL ("Sick Leave") 
   - EARNED ("Earned Leave")

2. **Validation Rules** (Policy v2.0 - Source of Truth: `/docs/Policy Logic/`):
   - Reason: Minimum 10 characters required (UI), 3 characters (API minimum)
   - Medical certificate: Required when MEDICAL leave > 3 days (hard block)
   - Fitness certificate: Required for ML > 7 days when returning to duty
   - Date validation: Start date must be <= end date
   - Start/End dates: Cannot be Friday, Saturday, or company holidays
   - Balance check: Cannot exceed available balance
   - CASUAL: Max 3 consecutive days per spell (hard limit), annual cap 10 days/year, cannot touch Fri/Sat/holidays, no backdating
   - MEDICAL: Annual cap 14 days/year, backdating allowed up to 30 days, no advance notice required
   - EARNED: ≥5 working days advance notice (not 15 days), 24 days/year accrual (2 days/month), carry-forward up to 60 days, backdating allowed up to 30 days

3. **Form Layout**:
   - Two-column layout: Main form (2fr) + Sidebar summary (1fr)
   - Card styling: `rounded-xl border border-slate-200 bg-white p-6 shadow-sm`
   - Spacing: `gap-6` (24pt), `space-y-6` for vertical spacing

4. **Error Messages** (Policy v2.0):
   - Date validation:
     - "Start date is required"
     - "End date is required"
     - "End date must be on or after start date"
     - "Start date cannot be on Friday, Saturday, or a company holiday"
     - "End date cannot be on Friday, Saturday, or a company holiday"
     - "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead."
   - Leave type specific:
     - "Earned Leave requires at least 5 working days' advance notice"
     - "Casual Leave cannot exceed 3 consecutive days per spell"
     - "Casual Leave annual cap exceeded (10 days/year limit)"
     - "Medical Leave annual cap exceeded (14 days/year limit)"
     - "Insufficient balance for this leave type"
     - "Earned Leave carry-forward cap exceeded (60 days maximum)"
   - Reason field:
     - "Reason is required"
     - "Reason must be at least 10 characters"
   - File upload:
     - "Medical certificate is required for sick leave over 3 days"
     - "Unsupported file type. Use PDF, JPG, or PNG."
     - "File too large (max 5 MB)."
     - "File content type not allowed (PDF, JPG, PNG only)." (server-side MIME validation)
     - "Fitness certificate is required for medical leave over 7 days"

5. **File Upload** (Policy v2.0):
   - Max size: 5 MB (5,242,880 bytes)
   - Accepted formats: PDF, JPG, JPEG, PNG (case-insensitive)
   - Validation: Extension check (client) + MIME type validation (server via `file-type` library)
   - Storage: `/private/uploads/` (not publicly accessible), accessed via signed URLs (15-minute expiry)
   - Display: Show filename and size in KB
   - Medical certificate: Required if MEDICAL > 3 days
   - Fitness certificate: Required if MEDICAL > 7 days on return-to-duty

6. **Leave Status Flow** (Policy v2.0):
   - Standard: DRAFT → SUBMITTED → PENDING → APPROVED/REJECTED/CANCELLED
   - Additional statuses:
     - RETURNED: Returned for modification by approver
     - CANCELLATION_REQUESTED: Employee requested cancellation of APPROVED leave
     - RECALLED: Recalled by HR (balance restored)
     - OVERSTAY_PENDING: Employee past endDate without return confirmation

## Design Tokens (from globals.css)

### Colors (oklch format):
- **Primary**: `oklch(0.208 0.042 265.755)` - Dark blue
- **Primary Foreground**: `oklch(0.984 0.003 247.858)` - Near white
- **Secondary**: `oklch(0.968 0.007 247.896)` - Light gray
- **Destructive**: `oklch(0.577 0.245 27.325)` - Red
- **Border**: `oklch(0.929 0.013 255.508)` - Light gray border
- **Muted**: `oklch(0.968 0.007 247.896)` - Light background
- **Muted Foreground**: `oklch(0.554 0.046 257.417)` - Medium gray text

### Spacing Scale:
- `gap-6` = 24pt (1.5rem)
- `p-6` = 24pt padding
- `space-y-6` = 24pt vertical spacing
- `rounded-xl` = 12pt border radius (0.625rem * 2)
- `shadow-sm` = Subtle shadow

### Typography:
- Headings: `text-xl font-semibold` (large title, semibold)
- Body: `text-sm` (small, regular weight)
- Labels: `text-sm font-medium` (small, medium weight)
- Muted text: `text-muted-foreground` (secondary color)

## Component Patterns

### Buttons:
- Default: Primary background with white text, shadow-sm
- Outline: Border with transparent background
- Secondary: Light background
- Disabled: `opacity-50`, `disabled:pointer-events-none`

### Form Fields:
- Border: `border border-slate-200`
- Error state: `border-red-500`
- Padding: `p-6` for cards, `h-10` for inputs
- Focus: Ring with `focus-visible:ring-ring/50`

### Cards:
- Styling: `rounded-xl border border-slate-200 bg-white p-6 shadow-sm`
- Dark mode: Transparent borders, darker backgrounds

## Data Model (Prisma)

See `prisma-schema.prisma` for complete model definitions.

### Key Points (Policy v2.0):
- LeaveRequest model matches exactly what iOS exports
- Status enum: DRAFT, SUBMITTED, PENDING, APPROVED, REJECTED, CANCELLED, RETURNED, CANCELLATION_REQUESTED, RECALLED, OVERSTAY_PENDING
- LeaveType enum: EARNED, CASUAL, MEDICAL (primary), plus others for future
- workingDays: Calculated as (endDate - startDate) + 1 (inclusive calendar days, includes weekends/holidays)
- needsCertificate: Boolean, true when MEDICAL > 3 days
- fitnessCertificateUrl: String? (optional), required for ML > 7 days on return-to-duty
- policyVersion: String (e.g., "v2.0")
- Date fields: Normalized to Asia/Dhaka midnight before persistence
- Date format: DD/MM/YYYY for display, ISO8601 for API

## Consistency Requirements for iOS App

1. **Leave Types**: Only show CASUAL, MEDICAL, EARNED (matching web form)
2. **Validation**: Same rules as web app (Policy v2.0 from `/docs/Policy Logic/`)
   - EL: ≥5 working days notice (not 15 days), 24 days/year, carry-forward 60 days
   - CL: 3 consecutive days max (not 7), 10 days/year cap, cannot touch Fri/Sat/holidays
   - ML: 14 days/year cap, certificate if >3 days, fitness cert if >7 days on return
3. **Error Messages**: Use exact same wording from Policy Logic docs
4. **Status Labels**: Match web app display names (including Policy v2.0 statuses)
5. **Date Handling**: Asia/Dhaka timezone, DD/MM/YYYY format, normalize to midnight
6. **Spacing**: Match Tailwind scale (24pt = gap-6, 16pt = gap-4, etc.)
7. **Card Styling**: Similar visual appearance with iOS-native glass effects
8. **Form Layout**: Similar information hierarchy
9. **Policy Version**: Use "v2.0" in exported JSON (not "v1.1")

## Color Conversion Notes

iOS uses SwiftUI Color while web uses oklch. For consistency:
- Use system adaptive colors that approximate web colors
- Primary: System blue approximates web primary
- Use semantic colors (red for destructive, green for success) to match web
- Ensure dark mode support matches web app

