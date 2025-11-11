# CDBL Leave Management System - System Functionality

**Version:** 2.0
**Last Updated:** January 2025
**Status:** Production Ready

## Overview

This document provides a comprehensive list of all features and functionalities organized by functional module. The system is built as a modular Next.js application with role-based access control and enhanced security features.

---

## Module 1: Authentication & Authorization

### Features

1. **User Authentication**
   - Email/password login
   - JWT token-based session management
   - HTTP-only cookie storage
   - Automatic session validation
   - Logout functionality

2. **2-Factor Authentication (2FA)** ✨ NEW in v2.0
   - Email-based OTP verification
   - 6-digit OTP codes
   - 10-minute expiration
   - 3-attempt limit per code
   - Resend OTP functionality with cooldown
   - Rate limiting (3 OTP requests per hour)
   - Professional HTML email templates
   - Countdown timer in UI
   - IP address tracking for security
   - Comprehensive audit logging

   **OTP Flow:**
   1. User submits email/password
   2. Credentials verified
   3. OTP generated and stored in database
   4. Email sent with 6-digit code
   5. User enters OTP code
   6. OTP verified (max 3 attempts)
   7. JWT token issued on success
   8. OTP marked as used

3. **Session Management**
   - Persistent sessions via cookies
   - Automatic token refresh
   - Session validation on protected routes
   - User context available throughout app
   - Session timeout after 7 days

4. **Role-Based Access Control (RBAC)**
   - 5-tier role hierarchy
   - Route-level protection
   - Component-level permission checks
   - API-level authorization

**Location**: `app/login/`, `app/api/auth/`, `lib/auth.ts`, `lib/rbac.ts`, `lib/otp.ts`, `lib/email.ts`

**Database Tables**: `User`, `OtpCode` (new in v2.0)

---

## Module 2: Leave Management

### 2.1 Leave Application

**Features**:
- Multi-step leave application form
- Leave type selection (EARNED, CASUAL, MEDICAL, etc.)
- Date range picker with holiday/weekend validation
- Reason field with character count validation
- Medical certificate upload (conditional)
- Real-time balance display
- Draft auto-save functionality
- Policy validation with warnings
- Leave summary sidebar

**Validation**:
- Date range validation (start ≤ end)
- Weekend/holiday restrictions
- Advance notice requirements
- Balance availability checks
- Annual cap enforcement
- Consecutive days limits
- Medical certificate requirements

**Location**: `app/leaves/apply/`

---

### 2.2 Leave Viewing & History

**Features**:
- Personal leave history (`/leaves`)
- All leaves list (`/leaves`)
- Leave detail view
- Status tracking
- Approval timeline
- Filtering by status, type, year
- Search functionality

**Location**: `app/leaves/page.tsx`

---

### 2.3 Leave Cancellation

**Features**:
- Cancel pending leave requests
- Status validation (only PENDING/SUBMITTED)
- Cancellation confirmation
- Balance restoration (not yet implemented)

**Location**: `app/api/leaves/[id]/route.ts` (PATCH)

---

## Module 3: Approval Workflow

### 3.1 Approval Chain

**Features**:
- 4-step sequential approval chain
- Role-based forwarding
- Final approval/rejection authority
- Self-approval prevention
- Approval comments

**Approval Chain**:
1. HR_ADMIN → Forward to DEPT_HEAD
2. DEPT_HEAD → Forward to HR_HEAD
3. HR_HEAD → Approve/Reject or Forward to CEO
4. CEO → Final Approve/Reject

**Location**: `app/api/leaves/[id]/approve|reject|forward/route.ts`, `lib/workflow.ts`

---

### 3.2 Approval Queue

**Features**:
- Pending approvals view (`/approvals`)
- Role-based filtering
- Approval actions (Approve/Reject/Forward)
- Bulk operations (future)
- Approval history

**Location**: `app/approvals/`

---

## Module 4: Balance Management

### 4.1 Leave Balance Tracking

**Features**:
- Real-time balance display
- Balance by leave type (EL, CL, ML)
- Opening balance (carry-forward)
- Accrued balance
- Used balance
- Remaining balance calculation
- Balance projection (after request)

**Location**: `app/api/balance/mine/route.ts`, `app/balance/page.tsx`

---

### 4.2 Balance Calculations

**Features**:
- Available balance = opening + accrued - used
- Annual cap tracking (CL: 10, ML: 14)
- Carry-forward cap (EL: 60 days)
- Balance deduction on approval (not yet implemented)
- Balance restoration on cancellation (not yet implemented)

**Location**: `app/api/leaves/route.ts`, balance calculation logic

---

## Module 5: Holiday Management

### 5.1 Holiday Calendar

**Features**:
- View company holidays (`/holidays`)
- Holiday list with dates
- Optional holiday marking
- PDF export of holiday calendar
- Holiday impact on leave dates

**Location**: `app/holidays/`

---

### 5.2 Holiday Administration

**Features**:
- Add/Edit/Delete holidays (`/admin/holidays`)
- CSV import functionality
- Bulk holiday creation
- Holiday validation
- Optional holiday flag

**Location**: `app/admin/holidays/`

---

## Module 6: Employee Management

### 6.1 Employee Directory

**Features**:
- Employee listing (`/employees`)
- Role-based filtering
- Search functionality
- Employee profile cards
- Department filtering

**Location**: `app/employees/`

---

### 6.2 Employee Profile

**Features**:
- Employee detail view (`/employees/[id]`)
- Leave history per employee
- Leave statistics and charts
- Balance information (admin view)
- Edit employee information (role-based)
- Approval actions (for HR roles)

**Location**: `app/employees/[id]/`

---

### 6.3 Employee Administration

**Features**:
- Create new employees (`/admin`)
- Edit employee profiles
- Assign roles
- Manage departments
- Employee data management

**Location**: `app/admin/components/user-management.tsx`

---

## Module 7: Dashboard & Analytics

### 7.1 Personal Dashboard

**Features**:
- Leave balance summary cards
- Recent leave requests
- Monthly usage trends
- Leave type distribution
- Policy reminders
- Pending approvals count
- Today's status
- Activity panel

**Enhanced KPIs** ✨ NEW in v2.0:
- **Approval Stage Tracking**: Shows current stage in approval workflow
- **Role-based Icons**: Dynamic icons based on current approver (HR Admin, Manager, HR Head, CEO)
- **Average Wait Time**: Displays average waiting time for pending requests
- **Stage Visibility**: Clear indication of where requests are in the approval chain

**Example KPI Display**:
```
Pending Requests: 3
With HR Head • 2d avg wait
```

**Location**: `app/dashboard/`, `components/dashboards/employee/ModernOverview.tsx`

---

### 7.2 Manager Dashboard

**Features**:
- Team leave overview
- Team statistics
- Team member leave calendar
- Department-level analytics

**Location**: `app/manager/dashboard/`

---

### 7.3 HR Dashboard

**Features**:
- All pending leave requests
- Organization-wide statistics
- Approval queue
- Employee management tools

**Location**: `app/admin/page.tsx`

---

### 7.4 Executive Dashboard

**Features**:
- Executive KPIs
- Organization-wide analytics
- Strategic metrics
- System health overview

**Location**: `app/hr-head/dashboard/`, `app/ceo/dashboard/`

---

### 7.5 Analytics & Reporting

**Features**:
- Monthly usage analytics (`/api/dashboard/analytics`)
- Leave distribution charts
- Trend analysis
- Policy compliance metrics
- Custom date range queries

**Location**: `app/api/dashboard/analytics/route.ts`, dashboard components

---

## Module 8: Policy & Compliance

### 8.1 Policy Enforcement

**Features**:
- Automatic policy rule enforcement
- Hard blocks for policy violations
- Soft warnings for policy advisories
- Policy version tracking
- Policy compliance dashboard

**Location**: `lib/policy.ts`, validation logic in API routes

---

### 8.2 Compliance Validation

**Features**:
- Policy compliance checks (`/api/compliance/validate`)
- Automated policy audit
- Compliance reporting
- Policy rule verification

**Location**: `app/api/compliance/validate/route.ts`, `scripts/policy-audit.ts`

---

### 8.3 Policy Documentation

**Features**:
- Policy viewing (`/policies`)
- Leave policy reference
- Policy tips and guidance
- Rule explanations

**Location**: `app/policies/`

---

## Module 9: Audit & Logging

### 9.1 Audit Trail

**Features**:
- Complete audit log (`/admin/audit`)
- Action tracking
- User activity logging
- Approval chain history
- Backdate confirmation logging

**Location**: `app/admin/audit/`, `app/api/admin/logs/route.ts`

---

### 9.2 Audit Log Features

**Features**:
- Filter by date range
- Filter by action type
- Filter by actor
- Export audit logs
- Search functionality

**Actions Tracked**:
- LEAVE_APPROVE
- LEAVE_REJECT
- LEAVE_FORWARD
- LEAVE_BACKDATE_ASK
- LEAVE_CANCELLED
- Employee management actions

---

## Module 10: File Management

### 10.1 Medical Certificate Upload

**Features**:
- File upload for medical certificates
- File type validation (PDF, JPG, PNG)
- File size validation (5 MB max)
- File storage (`private/uploads/`) via signed URLs
- Secure file naming (UUID-based)
- Certificate URL storage

**Location**: `app/leaves/apply/_components/file-upload-section.tsx`

---

## Module 11: Notifications & Alerts

### 11.1 Dashboard Alerts

**Features**:
- Policy reminders
- Balance warnings
- Pending approval alerts
- System notifications

**Location**: `app/api/dashboard/alerts/route.ts`, dashboard components

---

### 11.2 Notification System

**Features**:
- Latest notifications API (`/api/notifications/latest`)
- Notification dropdown (future)
- Real-time updates (future)

**Location**: `app/api/notifications/latest/route.ts`, `components/notifications/`

---

## Module 12: Settings & Configuration

### 12.1 User Settings

**Features**:
- User preferences (`/settings`)
- Dashboard customization (future)
- Profile settings (future)

**Location**: `app/settings/`

---

### 12.2 Organization Settings

**Features**:
- Backdate configuration (`OrgSettings`)
- Policy configuration
- System settings management

**Location**: `lib/org-settings.ts`, `app/api/admin/policies/`

---

## Module 13: Reports

### 13.1 Reporting Features

**Features**:
- Leave reports (`/reports`)
- Export functionality (future)
- Custom report generation (future)

**Location**: `app/reports/`

---

## Module 14: Help & Support

### 14.1 Help Center

**Features**:
- FAQ section (`/help`)
- Contact support
- Policy guidance
- User documentation links

**Location**: `app/help/`

---

## Module 15: Layout & Navigation

### 15.1 Navigation Components

**Features**:
- FloatingDock (bottom navigation)
- TopNavBar
- Unified Layout
- Control Center
- Search Modal
- Live Clock

**Location**: `components/layout/`

---

## Module 16: Admin Functions

### 16.1 User Management

**Features**:
- Create users
- Edit users
- Assign roles
- Manage departments
- User directory

**Location**: `app/admin/components/user-management.tsx`

---

### 16.2 System Administration

**Features**:
- Policy panel
- Audit logs
- System health monitoring
- Configuration management

**Location**: `app/admin/components/`

---

## Module 17: API Endpoints

### 17.1 Authentication APIs

- `POST /api/login` - User login (returns OTP requirement in v2.0)
- `POST /api/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - List users (admin)
- `POST /api/auth/verify-otp` - Verify OTP code ✨ NEW in v2.0
- `POST /api/auth/resend-otp` - Resend OTP code ✨ NEW in v2.0

---

### 17.2 Leave APIs

- `GET /api/leaves` - List leaves
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/[id]` - Get leave details
- `PATCH /api/leaves/[id]` - Cancel leave
- `POST /api/leaves/[id]/approve` - Approve leave
- `POST /api/leaves/[id]/reject` - Reject leave
- `POST /api/leaves/[id]/forward` - Forward leave

---

### 17.3 Balance APIs

- `GET /api/balance/mine` - Get own balances

---

### 17.4 Holiday APIs

- `GET /api/holidays` - List holidays
- `POST /api/holidays` - Create holiday
- `GET /api/holidays/[id]` - Get holiday
- `PATCH /api/holidays/[id]` - Update holiday
- `DELETE /api/holidays/[id]` - Delete holiday

---

### 17.5 Approval APIs

- `GET /api/approvals` - List pending approvals
- `POST /api/approvals/[id]/decision` - Make approval decision

---

### 17.6 Dashboard APIs

- `GET /api/dashboard/analytics` - Analytics data
- `GET /api/dashboard/alerts` - Dashboard alerts
- `GET /api/dashboard/recommendations` - Leave recommendations

---

### 17.7 Admin APIs

- `GET /api/admin/users` - List users
- `POST /api/admin/users/create` - Create user
- `GET /api/admin/users/[id]` - Get user
- `PATCH /api/admin/users/[id]` - Update user
- `GET /api/admin/logs` - Get audit logs
- `GET /api/admin/policies` - Get policies
- `PATCH /api/admin/policies/[id]` - Update policy

---

### 17.8 Compliance APIs

- `GET /api/compliance/validate` - Validate policy compliance

---

### 17.9 Other APIs

- `GET /api/policy` - Get policy settings
- `GET /api/me` - Get current user info
- `GET /api/employees/[id]` - Get employee data

---

## Module 18: UI/UX Enhancements ✨ NEW in v2.0

### 18.1 Interface Improvements

**My Leaves Page**:
- Removed redundant animated card above tabs
- 200px of vertical space reclaimed
- More room for leave request list
- Cleaner, more focused interface

**Navbar**:
- Fixed text wrapping issue in "My Leaves" menu item
- Added `whitespace-nowrap` to all navigation links
- Consistent appearance at all screen widths
- Better mobile responsiveness

**Upcoming Holidays Widget**:
- Fixed "No upcoming holidays" display bug
- Server-side filtering with `?upcoming=true` parameter
- Correct upcoming holidays displayed
- Improved data fetching logic

**Company Holidays Page**:
- Simplified filter controls with shorter labels
- Enhanced active state visibility with shadow effects
- Responsive icon-only mode on mobile devices
- Removed redundant active filter badge
- Cleaner, more intuitive filtering

**Location**: Various components throughout application

---

### 18.2 Accessibility Features (WCAG 2.1 AA Compliant)

**Multi-Modal Status Indicators**:
- **Icon Encoding**: Unique icon for each status
- **Color Encoding**: Distinct colors (accessibility-safe)
- **Text Encoding**: Clear status labels
- **Pattern Encoding**: Visual patterns for color-blind users

**Status Encoding System**:
- ✅ **APPROVED**: Green + Checkmark + Solid fill
- ⏱️ **PENDING**: Yellow + Clock + Dotted border
- ❌ **REJECTED**: Red + X + Diagonal stripes
- 🚫 **CANCELLED**: Gray + Ban + Solid fill

**Accessibility Features**:
- Sufficient contrast ratios (4.5:1 minimum)
- Screen reader friendly labels
- Keyboard navigation support
- Focus indicators on interactive elements
- ARIA labels for assistive technologies

**Benefits**:
- Accessible to users with protanopia, deuteranopia, tritanopia
- Better usability for all users
- Legal compliance with accessibility standards
- Professional, inclusive design

**Location**: `components/ui/status-badge.tsx`, `lib/accessibility.ts`

---

### 18.3 Design System Improvements

**Typography**:
- Consistent font hierarchy
- Readable font sizes
- Proper line heights
- Mobile-optimized text scaling

**Color System**:
- Accessible color palette
- Dark mode support
- High contrast ratios
- Color-blind safe combinations

**Spacing & Layout**:
- Consistent spacing scale
- Responsive grid system
- Mobile-first design approach
- Reduced visual clutter

**Animation & Feedback**:
- Smooth transitions
- Loading states
- Success/error feedback
- Micro-interactions

**Location**: `tailwind.config.ts`, component styles

---

## Module 19: API Client Architecture ✨ NEW in v2.0

### 19.1 Centralized API Client

**Features**:
- Unified API client replacing native `fetch` calls
- Automatic JWT token handling
- Centralized error handling
- Type-safe API calls
- Consistent response format
- Retry logic for network failures

**Benefits**:
- 21 files migrated to API client
- Reduced code duplication
- Easier maintenance
- Better error handling
- Type safety across application

**Client Functions**:
- `apiClient.get(url, options)` - GET requests
- `apiClient.post(url, data, options)` - POST requests
- `apiClient.patch(url, data, options)` - PATCH requests
- `apiClient.delete(url, options)` - DELETE requests

**Example Usage**:
```typescript
import { apiClient } from '@/lib/apiClient';

// Before (deprecated)
const response = await fetch('/api/leaves');
const data = await response.json();

// After (recommended)
const data = await apiClient.get('/api/leaves');
```

**Error Handling**:
- Automatic error parsing
- User-friendly error messages
- HTTP status code handling
- Network error recovery

**Location**: `lib/apiClient.ts`

**Files Migrated**: 21 component files including:
- All dashboard components
- All approval components
- Leave request components
- User management components

---

## Module 20: Data Validation

### 20.1 Client-Side Validation

**Features**:
- Form field validation (React Hook Form + Zod)
- Real-time error display
- Character count indicators
- Date range validation
- File upload validation

---

### 18.2 Server-Side Validation

**Features**:
- API endpoint validation (Zod schemas)
- Policy rule enforcement
- Balance checks
- Annual cap validation
- Business rule validation

---

## Feature Status Summary

### Implemented Features ✅

**Core Features (v1.0)**:
- ✅ User authentication & authorization
- ✅ Leave application with validation
- ✅ Approval workflow (4-step chain)
- ✅ Balance tracking & display
- ✅ Holiday management
- ✅ Employee directory & profiles
- ✅ Role-based dashboards
- ✅ Policy enforcement
- ✅ Audit logging
- ✅ File upload (medical certificates)
- ✅ Leave cancellation

**Enhanced Features (v2.0)** ✨:
- ✅ 2-Factor Authentication (2FA) with email OTP
- ✅ Enhanced dashboard KPIs with approval stage tracking
- ✅ UI/UX improvements (cleaner interface, fixed navigation)
- ✅ Color-blind accessibility (WCAG 2.1 AA compliant)
- ✅ Multi-modal status indicators
- ✅ Centralized API client architecture
- ✅ Improved mobile responsiveness
- ✅ Professional documentation suite

### Partially Implemented ⚠️

- ⚠️ Balance updates (on approval - logic missing)
- ⚠️ Balance restoration (on cancellation - not implemented)
- ⚠️ Email notifications (2FA OTP only, leave events planned)
- ⚠️ Advanced reporting (basic included)

### Planned for Future Releases 📋

**v2.1 (Q2 2025)**:
- 📋 Automatic EL accrual (monthly job)
- 📋 Year transition automation (carry-forward, CL lapse)
- 📋 Balance automation (auto-deduction on approval)
- 📋 Email notifications for leave events
- 📋 Leave modification capability
- 📋 Advanced analytics dashboards

**v3.0 (Future)**:
- 📋 Return-to-duty workflow
- 📋 Overstay detection
- 📋 Bulk operations for admins
- 📋 Calendar integrations (Outlook, Google)
- 📋 Mobile app (PWA)
- 📋 AI-powered insights

---

## Related Documentation

- **API Reference**: [API Contracts](./API/API_Contracts.md)
- **User Roles**: [User Roles & Permissions](./04-User-Roles-and-Permissions.md)
- **Policy Rules**: [Policy Logic Reference](./Policy%20Logic/README.md)
- **Technical Details**: [Technical Documentation](./02-Technical-Documentation.md)

---

**Document Version**: 2.0
**Last Updated**: January 2025
**Total Modules**: 20 modules
**Total Features**: 120+ individual features (including v2.0 enhancements)
**Current System Version**: v2.0 (Production Ready)
