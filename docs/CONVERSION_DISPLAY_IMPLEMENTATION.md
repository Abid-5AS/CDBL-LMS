# Conversion Display UI Implementation

## Overview

This document describes the implementation of the conversion display UI for the CDBL Leave Management System. The UI shows how leaves are converted when they exceed policy limits:

- **ML > 14 days** → Split across ML (14), EL, Special EL, and Extraordinary
- **CL > 3 days** → Auto-converted to EL
- **EL overflow (60→180)** → Excess transferred to Special EL

## Implementation Summary

### Components Created

#### 1. ConversionDisplay Component
**Location:** `/components/leaves/ConversionDisplay.tsx`

Displays detailed conversion breakdown with:
- Original leave request details
- Conversion breakdown showing distribution across leave types
- Policy reference and description
- Applied by information
- Visual indicators and badges

**Features:**
- Full display mode with complete breakdown
- Compact mode for lists/tables
- ConversionBadge for quick visual indication
- Responsive design with dark mode support

**Usage:**
```tsx
<ConversionDisplay
  leave={{
    id: leave.id,
    type: leave.type,
    workingDays: leave.workingDays,
    conversionDetails: {
      originalType: "MEDICAL",
      originalDays: 20,
      conversions: [
        { type: "MEDICAL", days: 14 },
        { type: "EARNED", days: 4 },
        { type: "SPECIAL", days: 2 }
      ],
      timestamp: new Date(),
      appliedBy: "HR_HEAD",
      policy: "Policy 6.21.c",
      conversionType: "ML_SPLIT"
    }
  }}
  showPolicy={true}
/>
```

#### 2. ConversionHistory Component
**Location:** `/components/leaves/ConversionHistory.tsx`

Displays conversion history for a user with:
- Chronological list of conversions
- Summary statistics (total conversions, days converted, types)
- Links to associated leave requests
- Filtering by year
- Empty state when no conversions

**Features:**
- Full history view with pagination
- Summary card for dashboards
- Loading and error states
- Responsive table/card layout

**Usage:**
```tsx
// Full history
<ConversionHistory
  userId={user.id}
  year={2025}
  limit={10}
  showHeader={true}
/>

// Dashboard summary card
<ConversionSummaryCard
  userId={user.id}
  year={2025}
/>
```

### Backend Components

#### 3. Conversion Repository
**Location:** `/lib/repositories/conversion.repository.ts`

Handles retrieval and processing of conversion data:

**Functions:**
- `getLeaveConversionDetails(leaveId)` - Get conversion details for a specific leave
- `getUserConversionHistory(userId, year, limit)` - Get all conversions for a user
- `getUserConversionStats(userId, year)` - Get conversion statistics

**Data Sources:**
- Queries `AuditLog` table for `LEAVE_APPROVE` actions
- Parses `mlConversion` and `clConversion` details from JSON
- Queries `EL_OVERFLOW_TO_SPECIAL` audit events
- Joins with `LeaveRequest` data

#### 4. Conversions API Endpoint
**Location:** `/app/api/conversions/route.ts`

**Endpoint:** `GET /api/conversions`

**Query Parameters:**
- `userId` - "me" (default) or specific user ID (admin only)
- `year` - Year to fetch (default: current year)
- `limit` - Number of records (default: all)
- `stats` - If true, return only statistics

**Response:**
```json
{
  "conversions": [
    {
      "id": 123,
      "date": "2025-11-10T00:00:00Z",
      "leaveRequestId": 234,
      "conversionType": "ML_SPLIT",
      "originalType": "MEDICAL",
      "originalDays": 20,
      "conversions": [
        { "type": "MEDICAL", "days": 14 },
        { "type": "EARNED", "days": 4 },
        { "type": "SPECIAL", "days": 2 }
      ],
      "appliedBy": "HR_HEAD",
      "policy": "Policy 6.21.c"
    }
  ]
}
```

### Page Updates

#### 5. Leave Details Page
**Location:** `/app/leaves/[id]/page.tsx` and `_components/leave-details-content.tsx`

**Updates:**
- Fetches conversion details using `getLeaveConversionDetails()`
- Passes conversion details to `LeaveDetailsContent` component
- Displays `ConversionDisplay` component when conversions exist
- Shows conversion info prominently at top of leave details

**User Experience:**
- Employees see how their leave was split across types
- Approvers see conversion information for review
- Clear policy references explain why conversion occurred

#### 6. Balance Page
**Location:** `/app/balance/page.tsx`

**Updates:**
- Added `ConversionHistory` component below balance cards
- Shows all conversions for current year
- Links to full conversion history page

**User Experience:**
- Employees see conversion history alongside balances
- Understand how conversions affected their balance
- Quick access to leave request details

#### 7. Employee Dashboard
**Location:** `/components/dashboards/employee/ModernOverview.tsx`

**Updates:**
- Added `ConversionSummaryCard` to dashboard
- Shows conversion count and breakdown by type
- Only displayed when user has conversions
- Link to full conversion history

**User Experience:**
- Quick overview of conversions on main dashboard
- Prominent display encourages awareness
- Easy navigation to details

## Conversion Types

### ML_SPLIT (Medical Leave Split)
**Trigger:** Medical leave > 14 days

**Example Display:**
```
Original Request: 20 days Medical Leave

Breakdown After Conversion:
1. Medical Leave: 14 days (policy limit)
2. Earned Leave: 4 days
3. Special Earned Leave: 2 days

Total Duration: 20 days

Policy: Medical Leave is limited to 14 days/year (Policy 6.21.c).
Days exceeding this limit are automatically converted to other
available leave types.
```

### CL_TO_EL (Casual to Earned Conversion)
**Trigger:** Casual leave > 3 consecutive days

**Example Display:**
```
Original Request: 5 days Casual Leave

Conversion:
- Entire period converted to Earned Leave: 5 days

Reason: Casual Leave is limited to 3 consecutive days (Policy 6.20.e).
Your request has been automatically converted to Earned Leave which
provides greater flexibility.
```

### EL_OVERFLOW (EL Overflow to Special)
**Trigger:** EL balance > 60 days

**Example Display:**
```
Earned Leave Balance: 72 days (exceeds 60-day cap)

Conversion:
- Earned Leave (capped): 60 days
- Special Earned Leave (overflow): 12 days

Total Balance: 72 days

Policy: Earned Leave is capped at 60 days/year (Policy 6.19.c).
Excess balance automatically transfers to Special Earned Leave
bucket (max 120 days). Both can be used and encashed as needed.
```

## Data Flow

### Leave Approval with Conversion

1. **Leave Submitted:** Employee submits ML request for 20 days
2. **Approval Process:** HR approves the leave
3. **Conversion Logic:** `/app/api/leaves/[id]/approve/route.ts`
   - Detects ML > 14 days
   - Calls `calculateMLConversion()` from `/lib/medical-leave-conversion.ts`
   - Calculates split: 14 ML + 4 EL + 2 Special
   - Updates balances accordingly
   - Creates audit log with conversion details
4. **Audit Log Created:**
   ```json
   {
     "action": "LEAVE_APPROVE",
     "details": {
       "leaveId": 234,
       "mlConversion": {
         "applied": true,
         "breakdown": "**Original Request:** 20 days Medical Leave..."
       }
     }
   }
   ```
5. **Display:** User views leave details
   - `getLeaveConversionDetails()` queries audit log
   - Parses conversion breakdown
   - Displays `ConversionDisplay` component

### Conversion History Retrieval

1. **User Opens Balance Page**
2. **Component Mounts:** `ConversionHistory` component
3. **API Call:** `GET /api/conversions?userId=me&year=2025`
4. **Repository Query:** `getUserConversionHistory()`
   - Queries audit logs for `LEAVE_APPROVE` with conversions
   - Queries `EL_OVERFLOW_TO_SPECIAL` events
   - Parses JSON details
   - Joins with leave request data
   - Sorts chronologically
5. **Display:** Shows conversion history table

## Testing Scenarios

### Test 1: ML Conversion Display
**Steps:**
1. Create ML request for 20 days
2. Approve as HR/CEO
3. View leave details page
4. Navigate to balance page

**Expected Results:**
- ✅ Leave details shows conversion breakdown
- ✅ Shows 14 ML + 4 EL + 2 Special split
- ✅ Policy reference displayed
- ✅ Conversion appears in balance page history
- ✅ Dashboard shows conversion count

### Test 2: CL Conversion Display
**Steps:**
1. Create CL request for 5 days
2. Approve as HR/CEO
3. View leave details
4. Check balance page

**Expected Results:**
- ✅ Leave details shows conversion to EL
- ✅ Indicates entire 5 days converted to EL
- ✅ Explains policy reason
- ✅ Conversion listed in history
- ✅ Leave type updated to EARNED in database

### Test 3: EL Overflow Display
**Steps:**
1. Create leave that triggers EL overflow
2. Approve leave
3. View balance page
4. Check conversion history

**Expected Results:**
- ✅ Balance page shows EL: 60, Special: X
- ✅ Conversion history shows transfer
- ✅ Indicates 60-day cap reason
- ✅ Shows overflow to Special EL

### Test 4: Conversion History
**Steps:**
1. Create multiple conversions in year
2. Navigate to balance page
3. View conversion history section
4. Click "View Full History"

**Expected Results:**
- ✅ All conversions listed chronologically
- ✅ Each shows type, date, details
- ✅ Links to leave requests work
- ✅ Summary stats accurate
- ✅ Can filter by year

### Test 5: Dashboard Indicator
**Steps:**
1. Have employee with conversions
2. View employee dashboard
3. Check conversion summary card
4. Click "View Full History"

**Expected Results:**
- ✅ Shows conversion count
- ✅ Breakdown by type displayed
- ✅ Total days converted shown
- ✅ Link navigates to conversions page
- ✅ Card hidden when no conversions

## File Structure

```
cdbl-leave-management/
├── components/
│   └── leaves/
│       ├── ConversionDisplay.tsx          # Main conversion display component
│       └── ConversionHistory.tsx          # Conversion history & summary
├── lib/
│   └── repositories/
│       └── conversion.repository.ts       # Conversion data queries
├── app/
│   ├── api/
│   │   └── conversions/
│   │       └── route.ts                   # Conversions API endpoint
│   ├── leaves/
│   │   └── [id]/
│   │       ├── page.tsx                   # Updated to fetch conversions
│   │       └── _components/
│   │           └── leave-details-content.tsx  # Updated to display conversions
│   ├── balance/
│   │   └── page.tsx                       # Updated with conversion history
│   └── dashboard/
│       └── employee/
│           └── ModernOverview.tsx         # Updated with conversion card
└── docs/
    └── CONVERSION_DISPLAY_IMPLEMENTATION.md  # This file
```

## UI Patterns

### Color Scheme
- **Conversion Badge:** Blue (`blue-500`, `blue-50`, `blue-900`)
- **Success Indicators:** Green for completed conversions
- **Warning Indicators:** Yellow/Orange for pending conversions
- **Info Alerts:** Blue for policy information

### Icons
- `ArrowRightLeft` - Main conversion icon
- `Calendar` - Date indicators
- `FileText` - Leave request links
- `Info` - Policy information
- Various leave type icons

### Responsive Behavior
- **Mobile:** Single column, stacked layout
- **Tablet:** 2-column grid for history
- **Desktop:** Full grid layout with sidebar

## API Permissions

### `/api/conversions`
- **EMPLOYEE:** Can view own conversions only
- **HR_ADMIN, HR_HEAD, SYSTEM_ADMIN:** Can view any user's conversions
- **Query validation:** Rejects invalid user IDs or years

### Data Privacy
- Users can only access their own conversion data
- Admins can access all users for reporting
- Conversion details include policy references for transparency

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading:** Conversion history only loaded when viewed
2. **Pagination:** History limited to 10 by default, "View More" for full list
3. **Caching:** SWR caches conversion data, revalidates on focus
4. **Database Queries:** Indexed on `createdAt` for fast audit log queries
5. **Conditional Rendering:** Components only render when data exists

### Database Impact
- Queries audit logs (already indexed)
- Joins with leave requests (indexed on ID)
- No additional database tables needed
- Minimal performance overhead

## Future Enhancements

### Potential Additions
1. **Conversion Reports:** Generate PDF/Excel reports of conversions
2. **Conversion Notifications:** Email alerts when conversions occur
3. **Conversion Predictions:** Warn users before conversion applies
4. **Bulk Conversion View:** Admin page showing all conversions across organization
5. **Conversion Analytics:** Charts showing conversion trends over time
6. **Policy Links:** Direct links to policy documents from conversion displays

### Accessibility Improvements
1. Add ARIA labels to all interactive elements
2. Keyboard navigation for conversion history
3. Screen reader announcements for conversions
4. High contrast mode support
5. Focus indicators on all clickable items

## Support and Troubleshooting

### Common Issues

**Issue:** Conversions not showing in history
**Solution:** Check audit logs for `LEAVE_APPROVE` action with conversion details

**Issue:** Wrong conversion type displayed
**Solution:** Verify `conversionType` field in audit log details

**Issue:** Missing conversion details
**Solution:** Ensure approval process includes conversion logic and audit logging

**Issue:** Performance slow on history page
**Solution:** Add pagination or date range filters to limit query scope

### Debug Commands

```bash
# Check audit logs for conversions
SELECT * FROM AuditLog
WHERE action IN ('LEAVE_APPROVE', 'EL_OVERFLOW_TO_SPECIAL')
AND createdAt > '2025-01-01'
ORDER BY createdAt DESC;

# View conversion details
SELECT id, action, details FROM AuditLog
WHERE action = 'LEAVE_APPROVE'
AND JSON_EXTRACT(details, '$.mlConversion.applied') = true;

# Count conversions by type
SELECT
  JSON_EXTRACT(details, '$.mlConversion.applied') as ml_conversion,
  JSON_EXTRACT(details, '$.clConversion.applied') as cl_conversion,
  COUNT(*) as count
FROM AuditLog
WHERE action = 'LEAVE_APPROVE'
GROUP BY ml_conversion, cl_conversion;
```

## Implementation Status

✅ **Completed:**
- ConversionDisplay component
- ConversionHistory component
- Conversion repository
- Conversions API endpoint
- Leave details page integration
- Balance page integration
- Dashboard integration
- TypeScript types and interfaces
- Responsive design
- Dark mode support

⏳ **Testing:**
- Manual testing of all scenarios
- Integration testing
- User acceptance testing

📋 **Documentation:**
- Implementation guide (this file)
- Component API documentation
- Code comments

## Conclusion

The conversion display UI provides comprehensive visibility into how leave conversions work in the CDBL Leave Management System. Users can:

- See exactly how their leave requests were converted
- Understand the policy reasons for conversions
- Track conversion history over time
- Review conversions on dashboard for quick overview

The implementation follows best practices for:
- Component reusability
- Type safety
- Performance optimization
- Accessibility
- User experience

All conversions are transparently displayed with clear policy references, ensuring users understand the system's automated decisions.
