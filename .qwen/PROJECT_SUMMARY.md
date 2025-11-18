# Project Summary

## Overall Goal
Create a comprehensive leave management system for Central Depository Bangladesh Limited (CDBL) with both web and mobile applications that feature role-based access, policy enforcement, offline-first mobile capabilities, and real-time data synchronization.

## Key Knowledge
- **Technology Stack**: Web - Next.js 16, React 19, TypeScript 5.9.3, MySQL with Prisma 6.19.0, Tailwind CSS 4.x, shadcn/ui
- **Mobile Stack**: Expo SDK 54, React Native, TypeScript, SQLite, Expo Router
- **Architecture**: Web app serves as backend API for mobile app; mobile app is offline-first with sync capabilities
- **API Connection**: Mobile app connects to web backend at `http://10.64.11.18:3000` (uses local network IP)
- **User Roles**: EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN with different permissions
- **Leave Types**: 10+ leave types including Earned Leave (EL), Casual Leave (CL), Medical Leave (ML), Maternity/Paternity, Study Leave, Special Disability Leave, Quarantine Leave, Extra With/Without Pay, etc.
- **Policy Enforcement**: Automatic enforcement of CDBL HR Leave Policy (v1.1) with 4-step approval workflow (HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO)
- **Database**: MySQL schema with User, LeaveRequest, Approval, Balance, Holiday models and proper relationships
- **Development Commands**: 
  - Web: `npm run dev` (port 3000), `npm run build`
  - Mobile: `npx expo start --dev-client` (development client)

## Recent Actions
- [DONE] Fixed missing default exports in mobile route files (apply.tsx, calendar.tsx, _layout.tsx)
- [DONE] Updated Notification/NotificationService to properly handle secure storage modules with proper fallbacks
- [DONE] Fixed auth store imports in hooks to use correct syntax for Zustand stores
- [DONE] Added expo-secure-store module for enhanced security
- [DONE] Validated that all route files have proper exports and modules are available
- [DONE] Resolved sync service errors by ensuring proper database functions are implemented
- [DONE] Completed end-to-end testing of the leave application workflow from mobile to web approval
- [DONE] Verified policy enforcement rules work consistently across both platforms

## Current Plan
- [DONE] Ensure mobile app can connect to backend server via network IP
- [DONE] Test full authentication and data sync between mobile and web apps
- [DONE] Verify all role-based features work correctly in both web and mobile apps
- [DONE] Test offline mode functionality of mobile app with local data operations
- [DONE] Validate policy enforcement rules across both platforms
- [DONE] Perform end-to-end testing of leave application workflow from mobile to web approval

---

## Summary Metadata
**Update time**: 2025-11-18T06:25:59.245Z 
