# UI/UX Refactor Master Plan: CDBL Leave Management System

**Version:** 1.0
**Status:** Draft
**Target Audience:** Frontend Developers, UI/UX Designers

---

## 1. Global Design System "Reset"

We are moving away from "Startup/SaaS" aesthetics (gradients, glassmorphism, bounce animations) to a **"Strictly Corporate & Professional"** standard. The goal is **Trust, Clarity, and Efficiency**.

### 1.1 Typography & Density
**Font Family:** `Inter` (Google Fonts) - Standardize on this.
**Weights:**
- **Regular (400):** Body text, table data.
- **Medium (500):** Table headers, button text, navigation.
- **SemiBold (600):** Card titles, Section headers.
- **Bold (700):** Page titles, KPI numbers.

**Density Modes:**
*   **Comfortable (Employee, CEO):** More whitespace, larger cards. Focus on readability and high-level insights.
    *   *Base Text:* `text-sm` (14px) or `text-base` (16px)
    *   *Padding:* `p-6` for cards.
*   **Compact (HR Admin, Dept Head, System Admin):** Data-heavy views. Minimize scrolling.
    *   *Base Text:* `text-sm` (14px)
    *   *Table Density:* `py-2` rows.
    *   *Padding:* `p-4` for cards.

### 1.2 Color Palette: "Corporate Zinc"
**Philosophy:** High contrast, neutral backgrounds, semantic colors only for status/actions.

| Token | Tailwind Class | Hex Code (Ref) | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `bg-slate-900` | `#0f172a` | Primary buttons, active navigation items. |
| **Secondary** | `bg-white` | `#ffffff` | Card backgrounds, main content area. |
| **Background** | `bg-slate-50` | `#f8fafc` | App background (light gray to contrast with white cards). |
| **Border** | `border-slate-200` | `#e2e8f0` | Subtle dividers, card borders. |
| **Text Main** | `text-slate-900` | `#0f172a` | Headings, primary data. |
| **Text Muted** | `text-slate-500` | `#64748b` | Labels, secondary info. |
| **Success** | `text-emerald-700` / `bg-emerald-50` | - | "Approved", "Active" statuses. |
| **Warning** | `text-amber-700` / `bg-amber-50` | - | "Pending", "Review" statuses. |
| **Danger** | `text-red-700` / `bg-red-50` | - | "Rejected", "Overdue", "Delete" actions. |
| **Info** | `text-blue-700` / `bg-blue-50` | - | "Draft", Information alerts. |

**Strict Rules:**
*   **NO** Gradients (e.g., `bg-gradient-to-r`). Use solid colors.
*   **NO** Colored Shadows. Use standard black/gray shadows (`shadow-sm`, `shadow-md`).

### 1.3 Micro-Animation Rules
**Standard Transition:** `transition-all duration-100 ease-out`
*   **Hover Effects:**
    *   *Buttons:* Slight background darken (`hover:bg-slate-800`).
    *   *Cards:* Subtle border darken (`hover:border-slate-300`) or extremely subtle lift (`hover:-translate-y-[1px]`).
    *   *Table Rows:* Light gray background (`hover:bg-slate-50`).
*   **Forbidden:**
    *   Spring/Bounce animations.
    *   Long fade-ins (>200ms).
    *   Layout shifts that push content unexpectedly.

### 1.4 Component Refactors (Shadcn/UI)
*   **Buttons:** Remove "glow" effects. Use flat or subtle outline styles.
    *   *Primary:* Solid Slate-900, rounded-md.
    *   *Secondary:* Outline Slate-200, text-slate-700, hover:bg-slate-50.
*   **Cards:** Remove `backdrop-blur`. Use solid White (`bg-white`) with `border border-slate-200` and `shadow-sm`.
*   **Tables:** Remove "zebra striping" unless necessary. Use single-line borders (`divide-y divide-slate-100`). Header: `bg-slate-50 text-slate-500 uppercase text-xs font-medium`.
*   **Inputs:** `border-slate-300` focus: `ring-2 ring-slate-900 ring-offset-1`.

---

## 2. Role-Based Dashboard Specifications

### 2.1 Employee
**Core Goal:** **Speed & Clarity**. "How much leave do I have? How do I apply?"
**Layout Grid:** 2-Column (Left: 2/3 Main, Right: 1/3 Status)

| Position | Widget Name | Function & Data | Design Directive |
| :--- | :--- | :--- | :--- |
| **Top Left** | **Balance Overview** | EL/CL/ML Cards. Big numbers. | Simple white cards. **Bold** numbers. No icons or minimal icons. |
| **Top Right** | **Quick Actions** | "Apply Leave", "Policy" buttons. | Vertical list or simple button group. High visibility. |
| **Mid Left** | **Recent History** | Last 5 requests table. | Condensed table. Status badges (pill shape, solid color text). |
| **Mid Right** | **Upcoming Holidays** | Next 3 holidays. | Simple list. Date on left, Name on right. |
| **Bottom** | **Leave Calendar** | Personal leave view. | Month view. Simple dots for status. |

**Specific Refactors:**
*   **Balance Cards:** Remove colorful backgrounds. Use white card with a colored top border strip (e.g., `border-t-4 border-blue-500` for EL) to distinguish types.
*   **Apply Button:** Make it the most prominent element on the page, but keep it professional (e.g., "Apply for Leave" vs "New Request +").

### 2.2 Department Head (Manager)
**Core Goal:** **Team Oversight & Approval Speed**.
**Layout Grid:** 3-Column (Left: Team Status, Mid: Approvals, Right: Calendar)

| Position | Widget Name | Function & Data | Design Directive |
| :--- | :--- | :--- | :--- |
| **Top Full** | **Action Required** | Pending Approvals Counter. | Alert banner style if > 0. "You have 3 pending requests." |
| **Left Col** | **Team Availability** | "Who is out today?" list. | Avatar + Name list. "Back on [Date]". |
| **Mid Col** | **Approval Queue** | List of pending requests. | **Dense** cards. "Approve" (Check) / "Reject" (X) icon buttons for speed. |
| **Right Col** | **Team Calendar** | Mini-calendar with team dots. | Visualizing overlaps. Click to expand. |

**Specific Refactors:**
*   **Approval Queue:** Convert from a full table to a "Feed" style list for the dashboard widget. Show: Name, Dates, Reason (truncated), Conflict Warning (if any).
*   **Conflict Detection:** Highlight overlapping leaves in Red text within the approval card.

### 2.3 HR Administrator
**Core Goal:** **Efficiency & Processing**.
**Layout Grid:** Dashboard is less "visual", more "functional".

| Position | Widget Name | Function & Data | Design Directive |
| :--- | :--- | :--- | :--- |
| **Top Row** | **Stats Ticker** | Pending, Approved Today, On Leave. | Small, compact metric cards. |
| **Main Area** | **Master Request Table** | All incoming requests. | **Ultra-Dense Table**. Filters on top (Dept, Status, Date). Bulk Actions enabled. |
| **Sidebar** | **Quick Links** | "Add Employee", "Holidays", "Reports". | Simple text links list. |

**Specific Refactors:**
*   **Master Table:** Use `ag-grid` style density. Row height ~40px. Sticky headers.
*   **Filters:** Use Popover filters instead of taking up screen space.

### 2.4 HR Head
**Core Goal:** **Compliance & Strategy**.
**Layout Grid:** Analytical Dashboard.

| Position | Widget Name | Function & Data | Design Directive |
| :--- | :--- | :--- | :--- |
| **Top Row** | **Org Health** | Absenteeism Rate, Leave Utilization %. | Clean charts (Line/Bar). Minimal color (Monochrome + 1 accent). |
| **Left Col** | **Policy Violations** | List of irregularities. | Warning list. "High leave balance", "Frequent sick leave". |
| **Right Col** | **Dept Breakdown** | Leave taken by Dept. | Horizontal Bar chart. |

**Specific Refactors:**
*   **Charts:** Use `Recharts` or similar. Style them to be minimal. No grid lines, simple tooltips.
*   **Reports:** "Export to Excel" button should be prominent.

### 2.5 CEO
**Core Goal:** **High-Level Insights**.
**Layout Grid:** Executive Summary (Single Page View).

| Position | Widget Name | Function & Data | Design Directive |
| :--- | :--- | :--- | :--- |
| **Top Left** | **Headcount Status** | Total, On Leave, Active. | Large typography. Very clean. |
| **Top Right** | **Critical Approvals** | Requests needing CEO sign-off. | Distinct card. "3 Requests Awaiting Your Approval". |
| **Main** | **Leave Trends** | Year-over-Year comparison. | Simple line chart. "This Year" vs "Last Year". |

**Specific Refactors:**
*   **No Clutter:** Hide operational details. Only show what needs a decision or provides a strategic insight.

### 2.6 System Admin
**Core Goal:** **System Health & Control**.
**Layout Grid:** Technical Dashboard.

| Position | Widget Name | Function & Data | Design Directive |
| :--- | :--- | :--- | :--- |
| **Top Row** | **System Status** | Uptime, Error Rate, Last Backup. | Green/Red status indicators. |
| **Main** | **Audit Log Stream** | Recent system actions. | Terminal-like or log-view style. Monospace font for data. |
| **Bottom** | **User Management** | Quick user search/edit. | Search bar + Result list. |

**Specific Refactors:**
*   **Logs:** Use a monospace font (`font-mono`) for the audit log table to distinguish it from business data.

---

## 3. Page Consolidation Strategy

To streamline the "Corporate" workflow and reduce navigation fatigue:

1.  **DELETE `/calendar` (Standalone Page):**
    *   *Action:* Move the full calendar view into a **Tab** within the Dashboard for Employees and Managers.
    *   *Reason:* Users shouldn't have to switch pages just to see dates.

2.  **COMBINE `/approvals` into `/dashboard` (For Managers):**
    *   *Action:* The "Pending Approvals" should be the *primary* view on the Manager Dashboard. A "View All History" link can open a modal or a sub-page, but the active work happens on the dashboard.

3.  **REFACTOR `/leaves/apply` (Standalone Page) -> Modal/Drawer:**
    *   *Action:* Make "Apply Leave" a **Slide-over Drawer** or **Modal** accessible from *anywhere* (Global Action).
    *   *Reason:* Context switching is expensive. Let them apply while looking at their calendar.

4.  **MERGE `/settings` and `/profile`:**
    *   *Action:* Create a single "Account & Settings" page.
    *   *Reason:* Reduce menu clutter.

5.  **CONSOLIDATE Admin Pages:**
    *   *Action:* Group `/admin/users`, `/admin/holidays`, `/admin/policies` under a single `/admin` layout with a sidebar navigation, rather than top-level nav items.

---

## 4. Implementation Checklist

- [ ] **Step 1:** Update `globals.css` with new "Corporate Zinc" palette and remove legacy glassmorphism classes.
- [ ] **Step 2:** Refactor `Button`, `Card`, and `Table` components in `@/components/ui` to match the new strict design.
- [ ] **Step 3:** Rebuild **Employee Dashboard** (`/dashboard`) using the new 2-column grid and "Comfortable" density.
- [ ] **Step 4:** Rebuild **Manager Dashboard** (`/manager/dashboard`) focusing on the Approval Feed.
- [ ] **Step 5:** Implement the **Global Apply Drawer** and remove the dedicated `/leaves/apply` page route (or redirect it).
- [ ] **Step 6:** Apply "Compact" density to **HR Admin** pages.
