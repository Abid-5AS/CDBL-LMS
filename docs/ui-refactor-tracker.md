# UI Refactor Tracker

Use this checklist to chip away at the heaviest UI files. Each item links to the current file, calls out the main work needed, and leaves a checkbox so we can mark it done when the refactor merges.

## Completed Refactorings (2024-11-08)

### Duplicate Component Removal

- ✅ **StatusBadge** - Removed `app/dashboard/shared/StatusBadge.tsx`, unified to `components/shared/StatusBadge.tsx`
- ✅ **KPICard** - Removed `app/dashboard/shared/KPICard.tsx`, unified to `components/shared/KPICard.tsx` (includes KPIGrid)
- ✅ **QuickActions** - Removed `app/dashboard/shared/QuickActions.tsx`, unified to `components/shared/QuickActions.tsx`
- ✅ **FilterBar** - Removed `components/filters/FilterBar.tsx`, unified to `components/shared/FilterBar.tsx`

### Navigation Consolidation

- ✅ **TopNavBar** - Removed duplicates from `components/layout/TopNavBar.tsx` and `components/unified/TopNavBar.tsx`
- ✅ **Navbar** - `components/Navbar.tsx` now cleanly re-exports from `components/navbar/*` (modular structure)

### Legacy Cleanup

- ✅ **Legacy Components** - Removed unused `components/legacy/app-shell-deprecated.tsx` and `components/legacy/sidebar-deprecated.tsx`

### Shared Components Created

- ✅ **Table Components** - Created reusable `components/shared/tables/`:
  - `PendingRequestRow.tsx` - Reusable row component for pending request tables
  - `BulkActionToolbar.tsx` - Reusable bulk action toolbar with selection management
  - `index.ts` - Clean exports

### Hooks Extracted

- ✅ **usePendingRequests** - Created `components/dashboards/dept-head/hooks/usePendingRequests.ts` for managing pending requests (filtering, search, pagination, bulk actions)

## High Priority

- [ ] `components/dashboards/dept-head/Sections/PendingTable.tsx`  
      ✅ Created hook + shared components. TODO: Refactor component to use `usePendingRequests` hook and `PendingRequestRow`/`BulkActionToolbar` components.
- [ ] `app/admin/holidays/components/AdminHolidaysManagement.tsx`  
      Move CRUD mutations + form validation into a hook, create standalone list/table subcomponents, and isolate the editor dialog for reuse.
- [ ] `components/dashboards/hr-admin/Sections/PendingApprovals.tsx`  
      ✅ Shared components created. TODO: Refactor to use `usePendingRequests` hook and shared table components.
- [ ] `components/reports/PDFDocument.tsx`  
      Extract data mapping helpers and build section-level components (header, metrics table, approvals list) so the PDF shell only orchestrates layout.

## Medium Priority

- [ ] `components/HRAdmin/ApprovalTable.tsx`  
      Add `useApprovalTable` hook, break out action buttons/toolbar, and reuse row components from PendingApprovals to reduce duplication.
- [ ] `components/dashboards/employee/Sections/ActionCenter.tsx`  
      Convert each card/CTA into its own component and create a coordinator that just maps configuration → card so we can reuse cards elsewhere.
- [ ] `app/login/components/LoginForm.tsx`  
      Extract authentication mutation + validation schema into a hook and split social/login-assistance sections into separate components.
- [ ] `components/shared/LeaveBalancePanel.tsx`  
      Move the adapter/math helpers out of the component, add smaller subcomponents for summary tiles + meter, and reuse them across dashboards/forms.
- [ ] `app/leaves/apply/_components/apply-leave-form.tsx` (phase 2)  
      Continue the refactor by extracting the sticky CTA + confirmation wiring into components and pushing warning/range helpers fully into `useApplyLeaveForm`.

## Next Wave

- [ ] `app/leaves/[id]/edit/_components/edit-leave-form.tsx`
- [ ] `app/leaves/MyLeavesPageContent.tsx`
- [ ] `components/dashboards/employee/Sections/History.tsx`
- [ ] `components/layout/ControlCenter.tsx`
- [ ] `components/shared/SharedTimeline.tsx`
- [ ] `app/leaves/[id]/_components/leave-details-content.tsx`
- [ ] `components/shared/ReviewModal.tsx`
- [ ] `app/employees/components/EmployeeEditForm.tsx`
- [ ] `components/dashboards/employee/Sections/SortedTimeline.tsx`

> Tip: after refactoring each file, tick the box and capture a short note (e.g., “✅ 2025‑02‑10 – split into hook/table components”). This keeps the backlog honest and shows progress at a glance.
