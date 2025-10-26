# 🧩 CDBL LMS — HR Admin Employee Details Page (Full Redesign)

## 🎯 Objective

Transform the current modal (used in the HR Admin `/approvals` page) into a full, dedicated **Employee Details Page** with profile information, interactive charts, leave history, and approval actions.

The new page should serve as a **one-stop HR workspace** — giving complete context for an employee before the HR Admin approves or rejects a leave.

---

## 🧭 Navigation & Routing

1. When HR Admin clicks any row in the `/approvals` table:

   - Redirect to `/employees/[id]` using Next.js App Router dynamic routing.
   - Example: `/employees/emp002?from=approvals`
   - Use the `useRouter()` hook and `router.push()` for navigation.

2. Add a **“Back”** button or breadcrumb on the Employee Details Page to return to `/approvals`.

---

## 🧩 Page Structure: `/employees/[id]/page.tsx`

### Layout

```tsx
- Header (Employee Name + Back Button)
- Profile Overview Card (email, dept, designation, manager)
- Stats Cards Row (total leaves this year, avg duration, pending requests)
- Leave Balance Card (Casual, Sick, Earned)
- Charts Section (monthly trend, leave distribution)
- Leave History Table (past 5–10 requests)
- Approval Action Buttons (Approve / Reject)
```
