# 🚀 CDBL Leave Management System – Complete Build & Enhancement Plan

**Project Goal:**  
Transform the upgraded Next.js 16 CDBL Leave Management System into a polished, enterprise-grade internal HR platform — clean, fast, and fully role-based.

---

## ⚙️ 1. Architecture Cleanup & Role Routing

### 🎯 Objectives

- Refactor all dashboards into **role-specific layouts** (Employee / HR Admin / Super Admin).
- Remove duplicate or static filler (e.g., "Your Leave Snapshot", "Policy Reminders").
- Keep everything **dynamic**, **desktop-only**, and **data-driven**.

### ✅ Tasks

1. Split dashboard into:

   - `/components/dashboard/EmployeeDashboard.tsx`
   - `/components/dashboard/HRDashboard.tsx`
   - `/components/dashboard/SuperAdminDashboard.tsx`

2. Modify `/app/dashboard/page.tsx`:

   ```tsx
   import { getUserRole } from "@/lib/session";
   export default async function DashboardPage() {
     const role = await getUserRole();
     switch (role) {
       case "HR_ADMIN":
         return <HRDashboard />;
       case "SUPER_ADMIN":
         return <SuperAdminDashboard />;
       default:
         return <EmployeeDashboard />;
     }
   }
   ```

3. Ensure `proxy.ts` middleware guards roles and routes.
4. Clean all nav links dynamically by role.

---

## 🧩 2. Suspense & Caching Refactor (Next.js 16)

### 🎯 Objectives

- Eliminate "Uncached data accessed outside of `<Suspense>`" build errors.
- Use `cacheComponents: true` properly.

### ✅ Tasks

1. Move Prisma queries into isolated async subcomponents under `<Suspense>`.
2. Remove all `noStore()` and `cacheLife()` calls; instead use:

   ```tsx
   export const cache = "no-store";
   ```

3. Example:

   ```tsx
   <Suspense fallback={<Loader />}>
     <PendingLeaveTable />
   </Suspense>
   ```

4. Verify all GET/POST APIs use `export const cache = "no-store";`
5. Re-run `pnpm build` until all cache errors disappear.

---

## 🧱 3. Employee Dashboard – Clean, Functional, Minimal

### 🎯 Show only:

- Upcoming Holidays (next 5)
- Recent Leave Requests
- Compact Leave Balance cards (Earned, Casual, Sick)
- Optional Announcements

### 🧰 Tasks

- Replace all static "snapshot" cards with dynamic cards + progress bars.
- Add "Apply Leave" button on top-right.
- Remove date/time banners or filler text.
- Ensure all data comes via Prisma.

---

## 🧑‍💼 4. HR Admin Dashboard – Data-Centric and Actionable

### 🎯 Show only:

- **Pending Leave Requests**
  - Table with Employee, Type, Dates, Reason, Actions
  - Expand row or modal to view profile + history.
- **Encashment Requests**
- **Leave Statistics** (monthly trend + type distribution)
- **Quick Actions**: "Add Holiday", "Manage Employees", "Review Policies"

### 🧰 Tasks

- Add two Recharts (bar + pie) using cached analytics.
- Remove any static metrics or non-DB boxes.
- Make Approve/Reject actions use confirmation toasts.

---

## 👑 5. Super Admin Dashboard – System Oversight & Configuration

### 🎯 Show only:

1. **System Overview**: total employees, active admins, pending requests, upcoming holidays.
2. **Policy Management**:
   - Editable cards for max days, carry-forward, encashment rules.
3. **Role Management**:
   - Table to assign/revoke Employee/HR roles.
4. **Audit Logs**:
   - Table of recent approvals, updates, logins, etc.

### 🧰 Tasks

- Add Prisma model `AuditLog` if missing.
- Add `/app/admin/policies`, `/app/admin/logs`, `/app/admin/users`.
- Secure all admin routes with middleware.

---

## 📅 6. Holidays Management System

### 🎯 Pages

- `/holidays` – Employee view (read-only)
- `/admin/holidays` – HR/Admin view (CRUD)

### 🧰 Tasks

1. Add Prisma model:

   ```prisma
   model Holiday {
     id          Int      @id @default(autoincrement())
     title       String
     date        DateTime
     description String?
     createdAt   DateTime @default(now())
   }
   ```

2. Employee view: list upcoming holidays.
3. HR/Admin view: Add, Edit, Delete buttons.
4. Make forms modal-based, confirm delete with toast.

---

## 🧮 7. Analytics & Reporting

### 🎯 Add insights for HR/Admin:

- Total leaves per month (chart)
- Avg approval time
- Leave type distribution

### 🧰 Tasks

- Create `components/charts/LeaveTrend.tsx` and `LeaveTypePie.tsx`.
- Use `react-chartjs-2` or `recharts`.
- Fetch data using `cacheLife("days")` if appropriate.

---

## 💬 8. UI/UX Enhancements

### 🎨 General

- Adopt clean layout: `max-w-7xl mx-auto p-6 gap-6`.
- Standardize card size (`h-auto min-h-[180px]`).
- Use shadcn/ui components (Card, Table, Button, Modal, Tabs).
- Replace long tables with paginated DataTable if too large.
- Use consistent icons (lucide-react).

### 🧰 Tasks

- Convert top cards into grid (2–3 columns).
- Use consistent border & hover states.
- Add skeleton loaders for Suspense fallbacks.

---

## 🧠 9. Feature Additions & Enhancements

### ✅ New Features

- **Draggable dashboard cards** (future optional): add drag-and-drop layout memory using localStorage.
- **"Revert to Default Layout"** button.
- **Encashment module**: track and approve encashment requests.
- **Notifications bar**: for HR/Admin actions or announcements.
- **Dark mode toggle** (store in localStorage).
- **Audit Log Search and Filter** by Role/Date.
- **Policy PDF Viewer** embedded instead of raw link.

---

## 🧩 10. Data & API Layer Improvements

### 🎯 Fix / Enhance

- Replace raw fetches with typed API helpers (`/lib/api.ts`).
- Add error handling and success toasts globally.
- Ensure all API routes are async and non-cached (`cache = "no-store"`).
- Add unified error component for server errors.

---

## 🧱 11. Authentication & Session Handling

- Ensure session roles (Employee, HR, Admin) are resolved via JWT.
- Update `getUserRole()` to decode session properly.
- Redirect unauthorized access to `/login`.
- Add loading skeleton during session validation.

---

## 🧰 12. Code Quality & Testing

### ✅ Tasks

- Run `pnpm lint` and fix all issues.
- Add `eslint-config-next` and TypeScript strict mode.
- Run `pnpm build` (ensure zero cache/Suspense warnings).
- Test `/login`, `/dashboard`, `/approvals`, `/employees/[id]`, `/holidays`, `/admin`.

---

## 🧱 13. Optional Advanced Add-ons (Post-Launch)

- ✅ AI-based "Leave Recommendation" (Codex + MCP)
- ✅ Auto-sync BD Govt Holidays via API or .ics
- ✅ Leave analytics export to Excel/PDF
- ✅ Role-based dashboard customization saved in DB
- ✅ MCP-based inline debugging (Next DevTools integration)

---

## ✅ Final Deliverables

- Fully role-based dashboards.
- Clean responsive (desktop) UI.
- Functional leave + holiday + encashment + admin system.
- Build passes `pnpm build` with `cacheComponents: true`.
- No redundancy, no filler text.
- All pages accessible through protected routes only.

---

## 🧭 How to Use It in Cursor

1. Place this file in:

   ```
   tasks/tasks-complete-website.md
   ```

2. In Cursor chat, run:

   ```bash
   Run tasks-complete-website.md
   ```

3. Cursor will:
   - Parse it step by step.
   - Create missing components/pages.
   - Fix Suspense and caching automatically.
   - Polish the entire UI with Tailwind and shadcn components.
   - Optimize APIs, routes, and layouts.

---

**Built for Next.js 16 + Turbopack + Cache Components + MCP Integration**
