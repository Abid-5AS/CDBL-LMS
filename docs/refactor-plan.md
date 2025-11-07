# Web App Refactor Plan

## High-Priority
1. `app/dashboard/components/requests-table.tsx`
   - Extract `useLeaveRequests` hook for data fetch/mutations and selection state.
   - Split desktop and mobile renderers (`RequestsTableView`, `RequestsCardView`).
   - Add unit tests around the hook.

2. `components/unified/SlideDrawer.tsx` + `lib/ui-state.ts`
   - Share the leave dataset with RequestsTable (context or Zustand store).
   - Keep only `selectedRequestId` in global state; memoize lookups.

3. `lib/selection-context.tsx`
   - Replace dual states with a reducer managing a `Set`.
   - Derive `selectionCount` from the set length.

4. `components/Navbar.tsx`
   - Break into `useNavbarState`, `DesktopNav`, `MobileDrawer`.
   - Lazy-mount the drawer; keep body-lock logic inside the hook.

5. `app/api/leaves/route.ts`
   - Move policy/validation logic to a service module.
   - Keep GET/POST handlers slim and unit-test the service.

## Medium-Priority
6. `app/api/dev/seed/route.ts`
   - Add `NODE_ENV` guard, wrap in `prisma.$transaction`, log mutations.

7. Clean up legacy layout:
   - `components/legacy/app-shell-deprecated.tsx`
   - `components/legacy/sidebar-deprecated.tsx`
   - Delete once all routes use `LayoutWrapper`.

8. Remove dev-only routes/assets:
   - `app/test/page.tsx`
   - Any other playground files behind flags.

9. Normalize stat cards:
   - `components/kpi-card.tsx`
   - `components/HRStatCards.tsx`
   - Create a shared metric-card component.

10. `lib/rbac.ts`
    - Introduce declarative permission maps with tests.

11. `components/reports/ChartsSection.tsx`
    - Build the missing department chart component; share chart primitives with employee dashboard.

## Hygiene
12. Prune unused assets/config (`.codex/config.json`, `public/brand/office-fallback.jpg`) after confirming references.
13. Document required env vars in `.env.example`, and ensure `tasks.md` includes `pnpm lint`, `pnpm test`.
