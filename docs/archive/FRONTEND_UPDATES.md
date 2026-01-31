# Frontend Updates for New Approval Workflow

## Changes Made (2025-11-17)

### Updated Components

#### 1. ApprovalStepper (`components/shared/forms/ApprovalStepper.tsx`)
**Changes:**
- Added `requesterRole` prop to determine workflow stages dynamically
- Created `getStagesForRole()` function:
  - Regular employees: "Submitted" → "HR Admin" → "HR Head" → "Dept Head"
  - Dept heads: "Submitted" → "HR Admin" → "HR Head" → "CEO"
- Component now auto-selects correct workflow based on requester role

**Usage:**
```tsx
<ApprovalStepper
  currentIndex={2}
  requesterRole="EMPLOYEE"  // or "DEPT_HEAD"
/>
```

#### 2. Approval Utils (`components/shared/forms/approval-utils.ts`)
**Changes:**
- Updated `calculateCurrentStageIndex()` to accept `requesterRole` parameter
- Updated `getNextApproverRole()` to accept `requesterRole` parameter
- Both functions now determine correct workflow based on requester role
- Removed hardcoded old workflow assumptions

**Usage:**
```tsx
const currentIndex = calculateCurrentStageIndex(approvals, status, requester.role);
const nextRole = getNextApproverRole(currentIndex, requester.role);
```

### Components That Need Manual Updates

The following components use the above utilities and may need their call sites updated to pass `requesterRole`:

#### Approval Details Components:
1. `/app/approvals/[id]/_components/approval-details-content.tsx`
   - Update to pass `requester.role` to `calculateCurrentStageIndex()`
   - Update `ApprovalStepper` to pass `requesterRole`

2. `/app/approvals/[id]/_components/approval-action-card.tsx`
   - Verify action buttons show/hide based on new workflow
   - Update role checks if needed

#### Dashboard Components:
1. `/components/dashboards/hr-admin/sections/PendingApprovals.tsx`
   - Verify filtering works with new workflow

2. `/components/dashboards/dept-head/sections/PendingTable.tsx`
   - Update to show correct pending requests for dept heads

3. `/components/dashboards/hr-head/sections/ReturnedRequests.tsx`
   - Verify HR Head sees correct requests in workflow

4. `/components/hr-admin/ApprovalTable.tsx`
   - Update bulk action logic if needed

### Action Buttons

The following components control which actions are available:

1. `/components/shared/ApprovalActionButtons.tsx`
   - Verify buttons show correctly based on:
     - HR_ADMIN: Can forward, return (not approve/reject)
     - HR_HEAD: Can forward, return (not approve/reject)
     - DEPT_HEAD: Can approve/reject for employees
     - CEO: Can approve/reject for dept heads

### Search for Usage

To find all components using these utilities:

```bash
# Find usages of calculateCurrentStageIndex
grep -r "calculateCurrentStageIndex" --include="*.tsx" --include="*.ts"

# Find usages of ApprovalStepper
grep -r "<ApprovalStepper" --include="*.tsx"

# Find usages of getNextApproverRole
grep -r "getNextApproverRole" --include="*.tsx" --include="*.ts"
```

## Testing Checklist

### Approval Workflow Display:
- [ ] Employee leave request shows: Submitted → HR Admin → HR Head → Dept Head
- [ ] Dept head leave request shows: Submitted → HR Admin → HR Head → CEO
- [ ] Current step highlights correctly
- [ ] Completed steps show checkmarks
- [ ] Pending steps show correctly

### Action Buttons:
- [ ] HR_ADMIN can forward and return (not approve/reject)
- [ ] HR_HEAD can forward and return (not approve/reject)
- [ ] DEPT_HEAD can approve/reject employee requests
- [ ] CEO can approve/reject dept head requests
- [ ] Buttons disabled/hidden when not applicable

### Dashboard Views:
- [ ] HR Admin sees all pending at step 1
- [ ] HR Head sees all pending at step 2
- [ ] Dept Head sees employee requests at step 3
- [ ] CEO sees dept head requests at step 3
- [ ] Counts are accurate

### Partial Cancellation:
- [ ] Partial cancellation requests show in approval queue
- [ ] Follow same workflow as regular requests
- [ ] Balance restoration shown after approval

## API Considerations

The frontend now needs the `requester.role` field from API responses:

```typescript
// Example API response structure needed:
{
  id: 123,
  status: "PENDING",
  requester: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "EMPLOYEE"  // or "DEPT_HEAD"
  },
  approvals: [...],
  ...
}
```

Ensure all leave request API endpoints return the requester's role.

## Migration Notes

### Breaking Changes:
1. `calculateCurrentStageIndex()` signature changed - now requires `requesterRole`
2. `getNextApproverRole()` signature changed - now requires `requesterRole`
3. `ApprovalStepper` component - `requesterRole` prop recommended

### Backward Compatibility:
- Both functions have `requesterRole` as optional parameter
- Will default to employee workflow if not provided
- Existing code will work but may show incorrect workflow for dept heads

### Recommended Updates:
1. Update all call sites to pass `requesterRole`
2. Update API responses to include `requester.role`
3. Test both employee and dept head workflows thoroughly

## Component Update Priority

### High Priority (Core Workflow):
1. Approval details page
2. Approval action buttons
3. Dashboard pending views

### Medium Priority (User Experience):
4. Leave detail pages
5. Team views
6. Calendar displays

### Low Priority (Informational):
7. Historical views
8. Reports
9. Analytics

---

Last Updated: 2025-11-17
Related: New Approval Workflow Implementation
