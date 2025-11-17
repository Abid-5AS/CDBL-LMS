# Figma Design Guidelines - CDBL Leave Management System

## Purpose

This document provides clear guidelines for designers working in Figma to ensure designs are technically accurate, functionally correct, and aligned with the CDBL Leave Management System's business rules.

---

## 1. Employee Dashboard Design Rules

### 1.1 Core Components (Must Have)

#### Welcome Section

- **Text Format**: "Welcome back, [Employee Name]"
- **Required Info**: Current date, role indicator
- **Don't**: Use placeholder names like "John Doe" - use realistic Bangladeshi names
- **Example**: "Welcome back, Noor Rahman"

#### Action Center

- **Purpose**: Show leave requests requiring employee action (returned requests)
- **Display Fields**:
  - Leave Type (Earned Leave, Casual Leave, Medical Leave, Sick Leave)
  - Date Range (18/06/2025 → 19/06/2025)
  - Days (numerical: 2, 5, 10)
  - Returned By (manager/approver name + department)
  - Comment (reason for return)
  - Updated Date
- **Actions**: "Edit" (pencil icon) + "Resubmit" (send icon) buttons
- **Status Badge**: "Returned" in amber/warning color
- **Empty State**: "No action required" or "All caught up!"

#### Leave Overview Section

**Three Tabs**:

1. **Balance Tab**

   - Show leave balance cards in a grid (2-3 columns)
   - Each card displays:
     - Leave Type Name
     - Available Days (large number)
     - Total Entitled
     - Used Count
     - Progress bar or circular indicator
   - Color coding:
     - Earned Leave: Green (#16a34a)
     - Casual Leave: Blue (#2563eb)
     - Medical Leave: Cyan (#0ea5e9)
     - Sick Leave: Rose (#e11d48)
     - Maternity: Pink (#db2777)
     - Paternity: Violet (#7c3aed)

2. **Team Tab**

   - Show who's on leave today/this week
   - Display:
     - Team member name
     - Leave type
     - Duration (dates)
     - Status badge
   - Empty state: "No team members on leave"

3. **Insights Tab**
   - Leave usage statistics
   - Month-over-month trends
   - Recommendations (e.g., "You have 12 days expiring soon")

#### History & Analytics Section

**Four Tabs**:

1. **Recent Tab**

   - Recent leave requests (last 5-10)
   - Show: Type, Dates, Days, Status, Submitted Date
   - Status badges: Draft (gray), Submitted (blue), Approved (green), Rejected (red), Cancelled (gray)

2. **Timeline Tab**

   - Chronological view of all leaves
   - Visual timeline with color-coded markers

3. **Usage Tab**

   - Bar chart or pie chart showing leave type distribution
   - Year-to-date summary

4. **History Tab**
   - Complete leave history table
   - Sortable columns
   - Export option

### 1.2 Data Validation Rules

#### Leave Days

- **Must be**: Positive integers only
- **Range**: Typically 1-30 days (no decimals)
- **Examples**: ✅ 2, 5, 10 | ❌ 2.5, -1, 0

#### Dates

- **Format**: DD/MM/YYYY (Bangladesh standard)
- **Examples**: 18/06/2025, 05/11/2025
- **Don't**: Use MM/DD/YYYY or YYYY-MM-DD in UI

#### Status Values (Use EXACT wording)

- DRAFT (not "Draft Leave")
- SUBMITTED (not "Pending" or "Under Review")
- APPROVED (not "Accepted")
- REJECTED (not "Denied")
- RETURNED (not "Sent Back")
- CANCELLED (not "Canceled" - use double L)

#### Leave Types (Use EXACT wording)

- Earned Leave (not "Annual Leave" or "Vacation")
- Casual Leave (not "Personal Leave")
- Medical Leave (not "Health Leave")
- Sick Leave (not "Medical Leave")
- Maternity Leave
- Paternity Leave
- Unpaid Leave

### 1.3 Button & Action Labels

#### Primary Actions

- **Apply Leave** (not "Request Leave" or "Add Leave")
- **Submit Request** (not "Send" or "Submit")
- **Edit** (not "Modify" or "Change")
- **Cancel** (not "Delete" or "Remove")
- **Resubmit** (for returned requests)

#### Secondary Actions

- **View Details** (not "See More")
- **Export** (not "Download")
- **Filter** (not "Sort")

### 1.4 Color System (Semantic Colors)

#### Text Colors

- Primary Text: `#0b1220` (dark slate)
- Secondary Text: `#334155` (slate-700)
- Tertiary/Muted: `#64748b` (slate-500)

#### Background Colors

- Canvas (Page): `#ffffff` (white)
- Card Surface: `#ffffff` with border
- Section Header: `#f8fafc` (subtle gray)

#### Status Colors

- Success/Approved: Green `#16a34a`
- Warning/Returned: Amber `#d97706`
- Error/Rejected: Red `#e11d48`
- Info/Submitted: Blue `#2563eb`
- Draft/Cancelled: Gray `#6b7280`

#### Border & Shadow

- Border Soft: `#e5e7eb`
- Border Strong: `#cbd5e1`
- Shadow 1: Subtle elevation
- Shadow 2: Card elevation

### 1.5 Typography Rules

#### Font Family

- Primary: Inter or Geist Sans
- Monospace: Geist Mono (for codes/IDs)

#### Heading Sizes

- H1 (Page Title): 24px, Semibold
- H2 (Section): 18px, Semibold
- H3 (Subsection): 16px, Medium
- Body: 14px, Regular
- Small: 12px, Regular

#### Number Display

- Large numbers (balance): 32px, Semibold
- Regular numbers (days): 14px, Medium
- Keep numbers aligned (use tabular figures if possible)

---

## 2. Layout & Spacing

### 2.1 Container Widths

- Max width: 1280px (7xl)
- Content padding: 24px (6) on mobile, 32px (8) on desktop
- Card padding: 16px (4) minimum, 24px (6) recommended

### 2.2 Spacing Scale

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### 2.3 Border Radius

- Cards/Panels: 18px (lg)
- Inner Cards: 14px (md)
- Buttons: 8px (md)
- Pills/Badges: 999px (full)

### 2.4 Grid System

- Use 12-column grid
- Gap between items: 24px (6)
- Responsive breakpoints:
  - Mobile: < 768px (1 column)
  - Tablet: 768px - 1024px (2 columns)
  - Desktop: > 1024px (2-3 columns)

---

## 3. Component-Specific Rules

### 3.1 Cards

```
Structure:
┌─────────────────────────────────────┐
│ [Icon] Card Title            [Badge]│ <- Header (subtle bg)
├─────────────────────────────────────┤
│                                     │
│  Main Content Area                  │
│  - Data displays                    │
│  - Charts/visualizations            │
│                                     │
├─────────────────────────────────────┤
│  [Action Button]  [Secondary Btn]   │ <- Footer (optional)
└─────────────────────────────────────┘
```

**Requirements**:

- White background with 1px border
- Subtle shadow for elevation
- Rounded corners (14px for inner cards, 18px for sections)
- Section headers use subtle background (`#f8fafc`)

### 3.2 Tables

```
┌────────────────────────────────────────┐
│ TYPE      DATES        DAYS    STATUS │ <- Header (subtle bg)
├────────────────────────────────────────┤
│ Earned    18/06→19/06  2      Approved│
│ Casual    20/06→22/06  3      Pending │
└────────────────────────────────────────┘
```

**Requirements**:

- Header row: Subtle background, semibold text, uppercase
- Body rows: Hover state (light brand color mix)
- Alternating row backgrounds: Optional, very subtle
- Borders: Soft borders between rows
- Actions: Right-aligned, icon buttons

### 3.3 Status Badges

```
[●] APPROVED     (green background, darker green text)
[●] SUBMITTED    (blue background, darker blue text)
[●] REJECTED     (red background, darker red text)
[●] RETURNED     (amber background, darker amber text)
[●] DRAFT        (gray background, darker gray text)
```

**Requirements**:

- Rounded pill shape (full border radius)
- Small text (12px)
- Uppercase
- Sufficient contrast (WCAG AA minimum)
- Optional dot indicator

### 3.4 Empty States

**Components**:

- Icon (relevant to context)
- Primary message ("No pending requests")
- Secondary message (helpful guidance)
- Optional action button

**Don't**:

- Show empty tables with just headers
- Use generic "No data" messages
- Forget to add helpful next steps

---

## 4. Business Logic Rules

### 4.1 Leave Balance Display

- Show "Available" days (not "Remaining" or "Left")
- Display "Used" count separately
- Total = Available + Used
- If balance is low (< 3 days): Show warning indicator
- If expired: Mark as "Expired" (strikethrough or muted)

### 4.2 Date Range Logic

- Start date must be before or equal to end date
- No overlapping leave requests (show error if overlap detected)
- Weekend days: Visual indicator (different background/strikethrough)
- Holidays: Different color, marked clearly

### 4.3 Approval Flow (for reference)

```
EMPLOYEE → DEPT_HEAD → HR_ADMIN → HR_HEAD
           ↓ can return
           ↓ can reject
           ↓ can approve (if final approver)
```

**In Dashboard**:

- Show current approval stage
- Display who needs to act next
- Show complete approval history in timeline

### 4.4 Leave Request States

```
DRAFT → SUBMITTED → APPROVED
         ↓
      RETURNED (back to employee)
         ↓
      RESUBMITTED → APPROVED

Can be CANCELLED at any stage before APPROVED
REJECTED = Final state (no resubmission)
```

---

## 5. Content Guidelines

### 5.1 Messaging Tone

- Professional but friendly
- Clear and concise
- Use active voice
- Avoid jargon

**Examples**:

- ✅ "Your request has been approved"
- ❌ "The leave application was approved by the system"

### 5.2 Error Messages

- Explain what went wrong
- Suggest how to fix it
- No technical error codes in UI

**Examples**:

- ✅ "Start date cannot be in the past. Please select a future date."
- ❌ "Error 400: Invalid date"

### 5.3 Success Messages

- Confirm the action
- Indicate next steps if any

**Examples**:

- ✅ "Leave request submitted! Your manager will review it soon."
- ❌ "Success"

---

## 6. Accessibility Requirements

### 6.1 Color Contrast

- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Clear focus states

### 6.2 Interactive Elements

- Buttons: Minimum 44x44px touch target
- Links: Clearly distinguishable from text
- Form inputs: Clear labels and placeholders

### 6.3 Icons

- Always pair with text labels (or accessible tooltips)
- Don't rely solely on color to convey meaning
- Use familiar icon metaphors

---

## 7. Common Mistakes to Avoid

### ❌ Don't Do This:

1. Use "John Doe" or generic Western names → Use "Noor Rahman", "Fatima Ahmed"
2. Show decimal days (2.5 days) → Use whole numbers (2 days, 3 days)
3. Use MM/DD/YYYY format → Use DD/MM/YYYY
4. Write "Pending" status → Use correct status: SUBMITTED
5. Show empty cards with no content → Add empty states
6. Use bright neon colors → Use semantic, muted colors
7. Forget mobile responsive → Design mobile-first
8. Show all data in one column → Use responsive grid (1→2→3 columns)
9. Use tiny text (< 12px) → Minimum 12px for body text
10. Put actions far from related content → Keep actions close to what they affect

### ✅ Do This Instead:

1. Use realistic Bangladeshi names from the system
2. Display whole days only (1, 2, 5, 10, etc.)
3. Use DD/MM/YYYY consistently
4. Use exact status names from the system
5. Design meaningful empty states with guidance
6. Use the semantic color system provided
7. Design for mobile first, scale up
8. Use responsive grids that adapt to screen size
9. Use readable font sizes (14px minimum for body)
10. Group related actions with their content

---

## 8. Design Checklist

Before finalizing any dashboard design, verify:

- [ ] All leave types are spelled correctly
- [ ] All status values match the system exactly
- [ ] Dates use DD/MM/YYYY format
- [ ] Days are whole numbers (no decimals)
- [ ] Colors match the semantic color system
- [ ] Buttons use correct action labels
- [ ] Empty states are designed
- [ ] Mobile layout is functional (not just shrunk)
- [ ] Text is readable (sufficient contrast)
- [ ] Interactive elements are large enough (44px minimum)
- [ ] Cards have proper elevation (borders + shadows)
- [ ] Page background is white with elevated cards
- [ ] Section headers use subtle background color
- [ ] All text is in English (no placeholder lorem ipsum)
- [ ] Names are realistic (Bangladeshi context)
- [ ] Loading states are designed
- [ ] Error states are designed

---

## 9. Reference Data

### Sample Employee Data

```
Name: Noor Rahman
Employee ID: EMP001
Department: IT
Role: EMPLOYEE
Manager: Kamal Hassan (Head of IT)
```

### Sample Leave Balance

```
Earned Leave: 12 days available (8 used, 20 total)
Casual Leave: 8 days available (2 used, 10 total)
Medical Leave: 5 days available (5 used, 10 total)
Sick Leave: 10 days available (0 used, 10 total)
```

### Sample Leave Request

```
Type: Earned Leave
Start Date: 18/06/2025
End Date: 19/06/2025
Days: 2
Reason: "Personal work"
Status: SUBMITTED
Submitted: 05/11/2025
Current Approver: Kamal Hassan (Dept Head)
```

---

## 10. Figma File Organization

### Recommended Page Structure

```
📄 Cover (Overview + Guidelines)
📄 Design System
   - Colors
   - Typography
   - Components
   - Icons
📄 Employee Dashboard
   - Desktop (1440px)
   - Tablet (768px)
   - Mobile (375px)
📄 Components Library
   - Cards
   - Tables
   - Forms
   - Buttons
   - Status Badges
📄 States & Variations
   - Empty States
   - Loading States
   - Error States
   - Success States
```

### Component Naming Convention

```
Component/Variant/State
Examples:
- Card/Leave Balance/Default
- Button/Primary/Hover
- Table/Leave History/Empty
- Badge/Status/Approved
```

---

## Questions or Clarifications?

If you encounter any scenario not covered in this guide:

1. Check the technical documentation: `docs/05-System-Functionality.md`
2. Review the user roles: `docs/04-User-Roles-and-Permissions.md`
3. Consult the database schema: `docs/03-Database-Schema.md`
4. Ask the development team for clarification

**Remember**: When in doubt, prioritize clarity and usability over visual complexity.
