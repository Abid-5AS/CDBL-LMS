# Web App Reference - CDBL Leave Management System

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

2. **Validation Rules**:
   - Reason: Minimum 10 characters required
   - Medical certificate: Required when MEDICAL leave > 3 days
   - Date validation: Start date must be <= end date
   - Balance check: Cannot exceed available balance
   - CASUAL: Max 7 consecutive days, must retain 5 days balance
   - MEDICAL: Backdating allowed up to 30 days
   - EARNED: Submit at least 15 days in advance

3. **Form Layout**:
   - Two-column layout: Main form (2fr) + Sidebar summary (1fr)
   - Card styling: `rounded-xl border border-slate-200 bg-white p-6 shadow-sm`
   - Spacing: `gap-6` (24pt), `space-y-6` for vertical spacing

4. **Error Messages**:
   - "Start date is required"
   - "End date is required"
   - "End date must be on or after start date"
   - "Reason is required"
   - "Reason must be at least 10 characters"
   - "Medical certificate is required for sick leave over 3 days"
   - "Unsupported file type. Use PDF, JPG, or PNG."
   - "File too large (max 5 MB)."
   - "Insufficient balance for this leave type"

5. **File Upload**:
   - Max size: 5 MB
   - Accepted formats: PDF, JPG, JPEG, PNG
   - Display: Show filename and size in KB

6. **Leave Status Flow**:
   - DRAFT → SUBMITTED → PENDING → APPROVED/REJECTED/CANCELLED

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

### Key Points:
- LeaveRequest model matches exactly what iOS exports
- Status enum: DRAFT, SUBMITTED, PENDING, APPROVED, REJECTED, CANCELLED
- LeaveType enum: EARNED, CASUAL, MEDICAL (primary), plus others for future
- workingDays: Calculated as (endDate - startDate) + 1
- needsCertificate: Boolean, true when MEDICAL > 3 days
- policyVersion: String (e.g., "v1.1")

## Consistency Requirements for iOS App

1. **Leave Types**: Only show CASUAL, MEDICAL, EARNED (matching web form)
2. **Validation**: Same rules as web app
3. **Error Messages**: Use exact same wording
4. **Status Labels**: Match web app display names
5. **Spacing**: Match Tailwind scale (24pt = gap-6, 16pt = gap-4, etc.)
6. **Card Styling**: Similar visual appearance with iOS-native glass effects
7. **Form Layout**: Similar information hierarchy

## Color Conversion Notes

iOS uses SwiftUI Color while web uses oklch. For consistency:
- Use system adaptive colors that approximate web colors
- Primary: System blue approximates web primary
- Use semantic colors (red for destructive, green for success) to match web
- Ensure dark mode support matches web app

