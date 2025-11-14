# QA Testing - Quick Reference Guide

**Quick lookup for common testing tasks**
**Version**: 1.0

---

## One-Command Setup

```bash
# Complete setup in one command
npx prisma migrate reset --force && npm run dev
```

Then enable auth bypass:

```env
# .env.local
SKIP_AUTH=true
MOCK_USER_ROLE=CEO
```

Reload: `http://localhost:3000`

---

## Test Users Quick Reference

### Credentials

All users password: `Test@123456`

| Role | Email | Permissions |
|------|-------|-----------|
| CEO | ceo@cdbl.com | Full system access |
| HR_HEAD | hrhead@cdbl.com | Final approvals, policy config |
| HR_ADMIN | hradmin@cdbl.com | First-level approvals, user mgmt |
| DEPT_HEAD | depthead@cdbl.com | Team approvals, team view |
| EMPLOYEE | employee1@cdbl.com | Apply leaves, view own data |
| EMPLOYEE | employee2@cdbl.com | Apply leaves, view own data |
| EMPLOYEE | employee3@cdbl.com | Apply leaves, view own data |

### Switch Role Quickly

```bash
# Edit and save
sed -i "" "s/MOCK_USER_ROLE=.*/MOCK_USER_ROLE=CEO/" .env.local

# Then F5 to reload page
```

---

## Test Data Quick Reference

### Leave Balances (FY 2025)

| Type | Opening | Accrued | Used | Available |
|------|---------|---------|------|-----------|
| CL (Casual) | 5 | 8.33 | 2 | 11.33 |
| ML (Medical) | 0 | 11.67 | 1 | 10.67 |
| EL (Earned) | 15 | 15 | 5 | 25 |
| EL w/ Pay | 0 | 0 | 0 | 0 |
| EL w/o Pay | 0 | 0 | 0 | 0 |

### Holidays 2025

- Jan 26: Republic Day
- Mar 17: Bengali New Year
- Aug 15: Independence Day
- Dec 16: Victory Day
- Dec 25: Christmas (Optional)

---

## Common Test Scenarios

### Test 1: Simple Leave Application (5 min)

```
1. Login as: employee1@cdbl.com
2. Go to: /leaves/apply
3. Select: Casual Leave
4. Dates: 2025-12-04 to 2025-12-05 (2 days)
5. Reason: "Personal leave"
6. Submit

Expected: Leave created, status "Submitted"
```

### Test 2: Complete Approval Workflow (10 min)

```
STEP 1: Apply leave (as EMPLOYEE)
- Employee1 applies 3-day CL
- Status: Submitted

STEP 2: HR Admin approves (as HR_ADMIN)
- Go to /approvals
- Click Approve
- Status: Pending (next level)

STEP 3: Department Head approves (as DEPT_HEAD)
- Go to /approvals
- Click Approve
- Status: Pending (final level)

STEP 4: HR Head approves (as HR_HEAD)
- Go to /approvals
- Click Approve
- Status: Approved ✓

Expected: Complete workflow, balance updated
```

### Test 3: Policy Violation (5 min)

```
CL Max: 5 days/month
1. Try applying: 6 days CL in same month
2. System shows: "Exceeds monthly limit"
3. Cannot submit (hard block)

Result: PASS if error shown
```

### Test 4: Medical Certificate Upload (3 min)

```
1. Apply for: Medical Leave
2. Upload file: PDF/JPG/PNG
3. File size: <5MB
4. Submit

Expected: File saved, visible in request
```

### Test 5: Role Restriction (2 min)

```
Test: EMPLOYEE cannot approve leaves

1. Login as: employee1@cdbl.com
2. Go to: /approvals
3. Expected: Empty page or "No pending approvals"
4. Cannot see approve button

Result: PASS if restricted
```

---

## Testing Commands

### Database Commands

```bash
# Reset database
npx prisma migrate reset --force

# View database
npx prisma studio

# Run seed only
npm run seed

# View specific user data
mysql -u user -p cdbl_leave_test -e "SELECT * FROM User;"

# Clear specific table
mysql -u user -p cdbl_leave_test -e "TRUNCATE TABLE LeaveRequest;"
```

### Development Commands

```bash
# Start server
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build

# View logs (in server output)
# Ctrl+C stops server
```

---

## Common Issues & Fixes

### Issue: Still seeing login page

**Fix**:
```bash
# 1. Check .env.local
grep SKIP_AUTH .env.local
# Should show: SKIP_AUTH=true

# 2. Check NODE_ENV
grep NODE_ENV .env.local
# Should show: NODE_ENV=development

# 3. Clear cache and reload
# Browser: Ctrl+Shift+Delete
# Page: Ctrl+Shift+R
```

### Issue: Wrong role showing

**Fix**:
```bash
# 1. Check role in .env.local
grep MOCK_USER_ROLE .env.local

# 2. Update if wrong
sed -i "" "s/MOCK_USER_ROLE=.*/MOCK_USER_ROLE=CEO/" .env.local

# 3. Reload page (F5)
```

### Issue: Database connection error

**Fix**:
```bash
# 1. Check MySQL is running
mysql -u user -p -e "SELECT 1;"

# 2. Check credentials in .env.local
grep DATABASE_URL .env.local

# 3. Reset database
npx prisma migrate reset --force
```

### Issue: Can't apply leave (button disabled)

**Fix**:
```bash
# 1. Check balance
npx prisma studio
# Look at Balance table for the user

# 2. If balance is 0, reset it:
npm run seed

# 3. Or manually update balance in Prisma Studio
```

---

## Accessibility Checks

### Keyboard Navigation
- [ ] TAB moves between elements
- [ ] SHIFT+TAB goes backward
- [ ] ENTER activates buttons
- [ ] ESC closes modals
- [ ] Arrow keys work in dropdowns

### Screen Reader
- [ ] Headings announced
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Buttons have clear text
- [ ] Images have alt text

---

## Browser Testing Checklist

### Chrome/Edge
- [ ] Responsive (F12, toggle device toolbar)
- [ ] Touch works (mobile)
- [ ] Console clean (F12)

### Firefox
- [ ] Layout correct
- [ ] Animations smooth
- [ ] Console clean

### Safari
- [ ] Fonts render correctly
- [ ] Touch interactions work
- [ ] Layout shifts? No

---

## Key Workflows to Test

### Workflow 1: Complete Leave Cycle
```
Employee submits → HR_ADMIN reviews → DEPT_HEAD approves →
HR_HEAD approves → Leave active → Employee cancels →
HR_HEAD approves cancellation → Balance restored
```

### Workflow 2: Rejection & Resubmission
```
Employee submits → HR_ADMIN rejects with reason →
Employee sees rejection → Employee modifies →
Employee resubmits → Goes through approval again
```

### Workflow 3: Return for Modification
```
Employee submits → HR_ADMIN requests medical certificate →
Request returns to employee → Employee uploads certificate →
Employee resubmits → Approval continues
```

### Workflow 4: Multiple Leaves
```
Employee has approved leave Dec 1-3 →
Tries to apply overlapping leave Dec 3-5 →
System warns about overlap →
Can still submit (soft warning)
```

---

## Performance Tips

### Speed Up Testing

1. **Disable animations** (if available)
   - Reduces rendering time

2. **Use keyboard shortcuts**
   - Cmd/Ctrl+K for search
   - Tab to navigate

3. **Keep roles in tabs**
   - Tab 1: CEO (role)
   - Tab 2: HR_HEAD (role)
   - Tab 3: EMPLOYEE (role)
   - Switch via tabs instead of reloading

4. **Use Prisma Studio** for quick data changes
   - `npx prisma studio`
   - Edit data visually

---

## Documentation References

| Document | Purpose |
|----------|---------|
| QA_TESTING_GUIDE.md | Complete testing guide (200+ cases) |
| AUTH_BYPASS_IMPLEMENTATION.md | How to disable auth |
| DATABASE_RESET_AND_SEEDING.md | Database setup & reset |
| QA_QUICK_REFERENCE.md | This file - quick lookup |

---

## URLs Reference

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3000/dashboard |
| Apply Leave | http://localhost:3000/leaves/apply |
| Leave List | http://localhost:3000/leaves |
| Approvals | http://localhost:3000/approvals |
| Employees | http://localhost:3000/employees |
| Balance | http://localhost:3000/balance |
| Holidays | http://localhost:3000/holidays |
| Admin | http://localhost:3000/admin |

---

## Test Data IDs

### User IDs
- CEO: `user-ceo-001`
- HR_HEAD: `user-hrhead-001`
- HR_ADMIN: `user-hradmin-001`
- DEPT_HEAD: `user-depthead-001`
- EMPLOYEE1: `user-emp-001`
- EMPLOYEE2: `user-emp-002`
- EMPLOYEE3: `user-emp-003`

### Leave Type IDs
- Casual: `CASUAL_LEAVE`
- Medical: `MEDICAL_LEAVE`
- Earned: `EARNED_LEAVE`
- Extra with Pay: `EXTRA_LEAVE_WITH_PAY`
- Extra without Pay: `EXTRA_LEAVE_WITHOUT_PAY`

---

## Example Test Session (30 minutes)

```
Time: 30 minutes

0:00-5:00   Reset database & enable auth bypass
5:00-10:00  Test dashboard for all 6 roles
10:00-15:00 Test leave application form
15:00-20:00 Test complete approval workflow
20:00-25:00 Test edge cases (insufficient balance, weekends, holidays)
25:00-30:00 Test navigation and accessibility
```

---

## Before You Start

- [ ] MySQL running
- [ ] Database created
- [ ] `.env.local` configured
- [ ] `npm install` completed
- [ ] No build errors (`npm run build`)
- [ ] Server running (`npm run dev`)
- [ ] Auth bypass enabled
- [ ] Test user available
- [ ] Dashboard loading without login

---

## Sign-Off Checklist

When testing is complete:

- [ ] All 7 test users can login (or access via bypass)
- [ ] All 6 roles accessible
- [ ] Dashboard loads for each role
- [ ] Leave application works
- [ ] Approval workflow completes
- [ ] Balance updates correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] No accessibility issues

---

## Report Issues

Found a bug? Create a bug report with:

1. **Title**: Brief description
2. **Steps to reproduce**: Exact steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happened
5. **Screenshots**: If applicable
6. **Test user**: Which role/user was testing
7. **Environment**: Browser, OS
8. **Console errors**: Any JS errors (F12)

---

**Last Updated**: November 14, 2025
**Version**: 1.0
**Status**: Ready to use
