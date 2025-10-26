# 🧩 CDBL LMS — HR Admin Dashboard Revamp (Approvals Page)

## 🎯 Goal
Refactor the current `/approvals` page for the **HR Admin** role.
Remove employee-only features and build a proper **admin-level control panel** with smart data views.

---

## ✅ Objectives

### 1. Simplify Sidebar Navigation
Remove unnecessary pages for HR Admin:
- ❌ Apply Leave  
- ❌ My Requests  
- ❌ Balance & Policy  
Add / keep only these:
- Dashboard  
- Approvals  
- Employees  
- Holidays  
- Reports  
- Settings  
- Help  

---

### 2. Redesign `/approvals` Page
Create a clean, professional HR interface with:
- **Header:** “Pending Leave Approvals”
- **Table View:** list of all pending employee leave requests  
  - Columns: Employee | Type | Dates | Days | Reason | Stage | Actions  
  - Action buttons: `Approve`, `Reject`
- Clicking a row → opens a **detail modal** with:
  - Employee info (name, email, dept, designation, manager)
  - Leave summary (type, duration, reason, stage)
  - Current leave balances (CL, SL, EL)
  - Short history (last 5 requests)
  - Approve/Reject buttons with confirmation dialog

---

### 3. Add `EmployeeDetailModal` Component
- Uses a headless UI or Shadcn Dialog
- Displays employee profile and stats
- Includes “Close”, “Approve”, and “Reject” buttons
- Use dummy data first → connect API later

---

### 4. Add `ApprovalTable` Component
- Fetch from `/api/approvals`
- Supports `onClick` to open modal
- Shows different row highlight colors for `approved` / `pending`
- Keep responsive layout (Tailwind Grid / Flex)
- Pagination (optional for now)

---

### 5. (Optional Enhancement)
Create top **Stat Cards** above table:
- `Total Employees on Leave`
- `Total Pending Requests`
- `Avg Approval Time (YTD)`
- `Encashment Requests Pending`
Use `Card` components for consistency.

---

### 6. Code Conventions
- Framework: **Next.js 15 (App Router)**  
- Styling: **TailwindCSS**  
- Components under `/components/HRAdmin/`  
- API calls via `lib/api.ts`  
- TypeScript enforced  
- Dummy data seeded via `prisma/seed.ts` (if needed)

---

### 7. Testing Notes
- Ensure Approve/Reject buttons trigger mock API responses
- Ensure modal closes smoothly on approve/reject
- Ensure sidebar links reflect correct active route
- Run `npm run lint` and `npm run build` successfully

---

### 🧾 Deliverables
- [ ] `components/HRAdmin/ApprovalTable.tsx`
- [ ] `components/HRAdmin/EmployeeDetailModal.tsx`
- [ ] Updated `app/approvals/page.tsx`
- [ ] Sidebar updated for HR Admin
- [ ] Optional: `HRAdminStats.tsx` (cards at top)

---

### 💡 Stretch Goal (Future)
Add search + filters (by employee, type, status)
Add integration with Leave Encashment Module.

---

## 🔖 Reference
Based on **Frontend.md** → _Page 6: HR Admin Dashboard_  
and **CDBL Leave Management System.md** → _Section 5.3: HR Admin Role & Features_
