# Mobile/Web Parity Audit (Web as Source of Truth)

Scope: Compare mobile (Android + iOS) against the web app feature set, workflows, validations, and role coverage. This is a static audit of code, not runtime behavior.

Sources:
- Web routes: `app/**/page.tsx`
- Web leave rules/types: `lib/ui/ui.ts`, `app/leaves/apply/_components/*`
- Android navigation: `mobile/android/app/src/main/java/com/cdbl/leavemanager/ui/navigation/CDBLNavHost.kt`, `mobile/android/app/src/main/java/com/cdbl/leavemanager/ui/navigation/TopLevelDestination.kt`
- iOS navigation: `mobile/ios/CDBLLeaveManager/CDBLLeaveManager/MainTabView.swift`, `mobile/ios/CDBLLeaveManager/CDBLLeaveManager/Core/AppState.swift`

Status key:
- OK: Implemented and matches web intent
- PARTIAL: Implemented but missing parts or behavior
- MISSING: Not present in mobile

## Feature coverage matrix

| Web module / page | Android | iOS | Notes |
| --- | --- | --- | --- |
| Auth (login + OTP) | OK | OK | iOS/Android both have login + OTP flows. |
| Dashboards by role (employee, dept head, HR admin, HR head, CEO, system admin) | OK | OK | Role-based dashboards exist on both. |
| Leaves list (My Leaves) | OK | OK | Present on both. |
| Leave detail (timeline + actions) | PARTIAL | PARTIAL | iOS detail view has cancel only; Android has more actions but approvals detail is separate. |
| Apply leave (multi-step, policies, docs) | PARTIAL | PARTIAL | Mobile lacks web multi-step logic + document upload + policy-driven validations. |
| Leave edit (update existing request) | MISSING | MISSING | Web supports edit with certificate validation. |
| Leave calendar (my/team) | PARTIAL | PARTIAL | Android/iOS have team calendar only; web supports my/team modes. |
| Approvals list + actions | PARTIAL | PARTIAL | Android only approve/reject; iOS approve/reject/forward but no return. |
| Approvals detail page | MISSING | MISSING | Web has `/approvals/[id]` detail. |
| Leave balance | OK | OK | Present on both. |
| Encashment (employee requests) | OK | OK | Request + list present. |
| Encashment approvals/management | MISSING | MISSING | Web has `/encashment/requests` for admin/HR. |
| Holidays (view) | OK | OK | Present on both. |
| Holidays (admin management) | MISSING | MISSING | Web has `/admin/holidays`. |
| Reports/analytics | PARTIAL | PARTIAL | Android shows mostly static UI; iOS has richer charts but verify API parity. |
| Scheduled reports | PARTIAL | PARTIAL | Web has reporting infra; Android shows UI, iOS does not expose scheduling. |
| Employee directory (list + detail) | OK | OK | Present on both (Team/Employees). |
| Notifications (list + filters) | PARTIAL | PARTIAL | Android filters differ from web types; iOS is mock-only. |
| Settings (delegation, calendar integration) | OK | OK | Present on both. |
| Profile (edit, change password) | OK | OK | Present on both. |
| Policies | PARTIAL | PARTIAL | Android uses API-backed policies; iOS uses hardcoded list. |
| FAQ/Help | OK | OK | Present on both. |
| Guidelines | MISSING | MISSING | Web `/guidelines` only. |
| Feedback | OK | OK | Present on both. |
| Report issue | MISSING | MISSING | Web `/report-issue` only. |
| Docs / API docs | MISSING | MISSING | Web `/docs` and `/api-docs` only. |
| Webhooks (admin) | PARTIAL | PARTIAL | iOS has CRUD + test; Android list only. |
| Audit logs (admin) | OK | OK | Present on both. |
| Workflow policies (admin) | OK | OK | Present on both. |
| HRIS sync (admin) | OK | OK | Present on both. |
| HRIS conflicts (admin) | MISSING | MISSING | Web `/admin/hris/conflicts` only. |
| Escalation rules (admin) | MISSING | MISSING | Web `/admin/escalation-rules` only. |
| Annotations (admin) | MISSING | MISSING | Web `/admin/annotations` only. |
| Payroll (admin) | MISSING | MISSING | Web `/admin/payroll` only. |
| Admin tools | PARTIAL | MISSING | Android has `AdminToolsScreen` stub; iOS has no equivalent. |
| Webhooks management UI for system admin | PARTIAL | OK | Android list only; iOS has CRUD + test. |
| Experimental features | MISSING | MISSING | Web `/experimental-features` only. |

## Key logic/validation gaps (high impact)

1. Leave types parity
   - Web types include: EARNED, CASUAL, MEDICAL, MATERNITY, PATERNITY, STUDY, EXTRAWITHPAY, EXTRAWITHOUTPAY, SPECIAL_DISABILITY, QUARANTINE, SPECIAL.
   - Android apply supports most but does not include SPECIAL_DISABILITY and QUARANTINE selection.
   - iOS supports only a subset (EARNED, CASUAL, MEDICAL, COMPENSATORY, MATERNITY, PATERNITY, SPECIAL). Missing EXTRAWITHPAY/EXTRAWITHOUTPAY, STUDY, SPECIAL_DISABILITY, QUARANTINE.

2. Document handling + medical certificates
   - Web requires medical certificates for MEDICAL > 3 days and supports file upload during apply and edit.
   - Mobile has no document upload flow for apply or edit. iOS policy content is static and does not enforce document rules.

3. Approval workflow actions
   - Web supports approve, reject, forward, return; mobile is inconsistent:
     - Android: approve/reject only in approvals list; forward/return only appear in leave detail.
     - iOS: approve/reject/forward in approvals list; no return action.

4. Notifications type alignment
   - Web notification types: LEAVE_SUBMITTED/APPROVED/REJECTED/RETURNED/FORWARDED/CANCELLED.
   - Android filters use different type strings (leave_applied, approval_required, system, etc.).
   - iOS notifications are mock-only; no API integration.

5. Leave edit + post-approval document updates
   - Web allows editing leave requests and uploading fitness certificates after approval.
   - Mobile lacks leave edit and certificate upload flows.

## Role parity gaps

- System admin:
  - Missing escalation rules, annotations, payroll, HRIS conflicts on mobile.
  - Android admin tools appears stub-only; iOS has none.
- HR/Manager roles:
  - No approvals detail view on mobile.
  - Encashment approvals not available on mobile.

## Suggested next steps (implementation order)

1. Align leave types + validation rules
   - Add missing leave types in mobile models and UI.
   - Implement web-equivalent policy rules in mobile apply flows, including certificate requirements and thresholds.

2. Approvals parity
   - Add approvals detail screen and return action on both platforms.
   - Ensure full action set matches web: approve/reject/forward/return.

3. Document workflows
   - Add file upload for medical certificates and fitness certificates.
   - Add edit flow for leave requests.

4. Notifications parity
   - Match notification enums/types to web values.
   - Implement notifications API and mark-read on iOS.

5. Admin parity (if required on mobile)
   - Add missing admin modules: HRIS conflicts, escalation rules, annotations, payroll.
   - Expand Android webhooks to CRUD + test.
