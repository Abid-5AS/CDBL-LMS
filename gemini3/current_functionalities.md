# Current Functionalities and Layouts by Role

## 1. Employee (Standard User)
**Route:** `/dashboard/employee`

### Layout & Key Features
- **Overview Cards:**
  - **Leave Balance:** Shows available/consumed leave for Casual, Sick, and Earned types.
  - **Next Holiday:** Displays the upcoming public holiday.
  - **Pending Requests:** Count of leave requests awaiting approval.
- **Quick Actions:**
  - **Apply for Leave:** Modal/Form to submit a new leave request.
  - **View Calendar:** Link to the leave calendar.
- **Recent Activity / History:**
  - List of recent leave applications with status (Pending, Approved, Rejected).
- **Profile/Settings:**
  - Basic profile view (often in navbar or sidebar).

### Pain Points (Inferred)
- Limited visibility into approval chain status.
- Mobile responsiveness for complex tables.

## 2. Manager (Department Head / Line Manager)
**Route:** `/dashboard/manager`

### Layout & Key Features
- **Team Overview:**
  - **Team on Leave:** Who is currently absent.
  - **Pending Approvals:** Requests requiring their action.
- **Approval Workflow:**
  - **Actionable List:** Cards or table rows with "Approve" and "Reject" buttons.
  - **Request Details:** View reason, dates, and attachment for each request.
- **Team Calendar:**
  - View leave schedules for direct reports to avoid conflicts.
- **Reports:**
  - Basic team leave consumption reports.

### Pain Points (Inferred)
- Bulk approval capabilities might be missing or hidden.
- Conflict detection when multiple team members apply for the same dates.

## 3. HR Admin (Human Resources)
**Route:** `/dashboard/hr-admin`

### Layout & Key Features
- **System-Wide Overview:**
  - **Total Employees on Leave:** Aggregate count.
  - **Leave Trends:** Visualizations of leave types used over time.
- **Employee Management:**
  - **Leave Allocations:** Manually adjust or set leave balances.
  - **User Management:** (If applicable) Add/Edit employee details.
- **Global Calendar:**
  - View leave for the entire organization.
- **Reports & Analytics:**
  - Detailed exportable reports (CSV/PDF) for audit and payroll.
- **Policy Management:**
  - Configuration of leave types and rules (often a separate settings area).

### Pain Points (Inferred)
- Complex filtering needed for large datasets.
- Manual adjustments of balances can be error-prone without audit logs.

## 4. System Admin (IT / Super Admin)
**Route:** `/dashboard/admin` (or similar)

### Layout & Key Features
- **System Health:**
  - User activity logs, error rates (technical).
- **User Role Management:**
  - Assigning roles (HR, Manager, Employee).
- **Configuration:**
  - Global settings, email templates, integration settings.

## General Layout Structure
- **Navbar:**
  - Responsive, role-based links.
  - User profile dropdown with Logout.
  - Theme toggler (Light/Dark).
- **Sidebar (Desktop):**
  - Collapsible navigation for deeper features (Reports, Settings).
- **Mobile Menu:**
  - Hamburger menu for smaller screens.

## Visual Style
- **Theme:** "Soft Zinc" (Clean, corporate, neutral grays).
- **Dark Mode:** Fully supported with high contrast adjustments.
- **Glassmorphism:** Removed/minimized for a more professional "Corporate" look, though some elements may still retain subtle transparency.
