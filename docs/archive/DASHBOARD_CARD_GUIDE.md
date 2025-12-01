# HR & ADMIN Dashboard Card Guide

**Complete Guide to Understanding Each Card**

---

## 📊 All 7 Dashboard Cards Explained

Each card now has a comprehensive tooltip with:
- **What this shows:** Clear description
- **Why it matters:** Business value and targets
- **Calculation:** How the number is computed

---

### 1️⃣ Employees on Leave

**What You See:**
```
┌─────────────────────────┐
│ 👥 Employees on Leave  │
│                         │
│         12              │
│   Currently absent      │
│       today             │
└─────────────────────────┘
```

**When You Hover (ℹ️ icon):**
```
What this shows:
Number of employees who have approved leave today.
Helps you track workforce availability and capacity.

Why it matters:
Know how many people are out today to plan workload
and ensure adequate coverage.

Calculation:
Counts leaves where today falls between start and
end date with APPROVED status.
```

**Use Case:**
- Check this first thing in the morning
- If number is high (>15%), you may need to adjust workload
- Helps plan meetings and deadlines

---

### 2️⃣ Pending Requests ⭐ YOUR QUEUE

**What You See:**
```
┌─────────────────────────┐
│ ⏰ Pending Requests    │
│                         │
│          3              │
│   Awaiting action       │
└─────────────────────────┘
```

**When You Hover (ℹ️ icon):**
```
What this shows:
Leave requests awaiting YOUR action. This is your
personal work queue - not organization-wide pending
requests.

What to do:
Review each request and Forward to DEPT_HEAD,
Return for modification, or Reject if invalid.

Calculation:
Counts approvals where you are the approver and
decision is still PENDING.
```

**Use Case:**
- This is YOUR work queue (not everyone's)
- When you forward a request → it disappears from this count ✅
- Tells you exactly how much work you have to do today

---

### 3️⃣ Avg Approval Time

**What You See:**
```
┌─────────────────────────┐
│ 📈 Avg Approval Time   │
│                         │
│        2.3d             │
│   Processing speed      │
└─────────────────────────┘
```

**When You Hover (ℹ️ icon):**
```
What this shows:
Organization-wide average time from submission to
final decision. Shows overall system efficiency.

Why it matters:
Target is ≤3 days. Longer times indicate bottlenecks
in the approval chain and may frustrate employees.

Calculation:
Average of (updatedAt - createdAt) for last 100
processed requests in past 30 days.
```

**Use Case:**
- **Green (≤3 days):** System is efficient ✅
- **Yellow (3-5 days):** Some delays, investigate
- **Red (>5 days):** Major bottleneck, needs immediate attention
- **This is org-wide** (not your personal time)

---

### 4️⃣ Total Leaves (YTD)

**What You See:**
```
┌─────────────────────────┐
│ 📅 Total Leaves (YTD)  │
│                         │
│         247             │
│   Approved this year    │
└─────────────────────────┘
```

**When You Hover (ℹ️ icon):**
```
What this shows:
Total number of approved leave requests this year.
Helps track overall leave volume and trends.

Why it matters:
Higher numbers may indicate seasonal patterns, high
employee utilization of benefits, or potential
understaffing concerns.

Calculation:
Counts all APPROVED leaves where start date is in
current year.
```

**Use Case:**
- Compare to last year to spot trends
- High numbers in Q4? Likely holiday season
- Sudden spike? Check if mass vacation or issue

---

### 5️⃣ Daily Processing

**What You See:**
```
┌─────────────────────────┐
│ 🎯 Daily Processing    │
│                         │
│    8 of 10 target       │
│    ████████░░ 80%       │
└─────────────────────────┘
```

**When You Hover (ℹ️ icon):**
```
What this shows:
Organization-wide count of leave requests approved
or rejected today. Tracks daily processing momentum.

Why it matters:
Target of 10 per day is a general productivity
benchmark (not mandatory). Helps identify slow
processing days.

Calculation:
Counts all requests with APPROVED or REJECTED status
updated today, across all approvers.
```

**Use Case:**
- Shows team productivity (all approvers combined)
- Target of 10 is a guideline, not a rule
- Low count? Check if approvers are busy or on leave

---

### 6️⃣ Team Utilization ⚡ NOW CALCULATED LIVE

**What You See:**
```
┌─────────────────────────┐
│ 👥 Team Utilization    │
│                         │
│        87%              │
│   Workforce capacity    │
└─────────────────────────┘
```

**When You Hover (ℹ️ icon):**
```
What this shows:
Percentage of employees available for work today
(not on approved leave). Real-time workforce capacity
indicator.

Why it matters:
Target: ≥85%. Below this means too many people are
on leave, which may impact operations and require
workload adjustments.

Calculation:
(Total employees - On leave today) / Total employees
× 100%.
```

**Use Case:**
- **≥85%:** Good capacity ✅
- **75-85%:** Monitor closely
- **<75%:** High absence, adjust expectations
- **Real-time** - updates as leaves are approved

---

### 7️⃣ Compliance Score

**What You See:**
```
┌─────────────────────────┐
│ ✅ Compliance Score    │
│                         │
│         94%             │
│   Policy adherence      │
└─────────────────────────┘
```

**When You Hover (ℹ️ icon):**
```
What this shows:
Measures how well the organization follows leave
policies - proper documentation, timely processing,
and workflow adherence.

Why it matters:
Target: ≥90%. Low scores indicate policy violations,
documentation issues, or processing delays that need
attention.

Note:
Currently using placeholder value. Real calculation
coming soon (on-time processing + documentation +
policy adherence).
```

**Use Case:**
- Target: ≥90% compliance
- Measures policy adherence quality
- Coming soon: Real calculation
- Transparent about current placeholder status

---

## 🎯 Quick Decision Guide

### Morning Routine:
1. Check **Employees on Leave** - How many are out today?
2. Check **Team Utilization** - Do I have enough capacity?
3. Check **Pending Requests** - What's in my queue?

### Performance Monitoring:
1. Check **Avg Approval Time** - Are we fast enough? (target: ≤3 days)
2. Check **Daily Processing** - Is the team productive?
3. Check **Compliance Score** - Are we following policies?

### Trend Analysis:
1. Check **Total Leaves (YTD)** - What's the volume compared to last year?
2. Check **Team Utilization** over time - Any patterns?

---

## 💡 Pro Tips

### Understanding "Your Queue" vs "Org-Wide"

**YOUR QUEUE (Personal):**
- ✅ Pending Requests - Only YOUR pending approvals

**ORG-WIDE (Everyone):**
- ✅ Employees on Leave - All employees out today
- ✅ Avg Approval Time - System-wide average
- ✅ Total Leaves (YTD) - All approved leaves
- ✅ Daily Processing - All approvers combined
- ✅ Team Utilization - Workforce capacity
- ✅ Compliance Score - Organization adherence

### When Numbers Don't Make Sense

**"I forwarded 5 requests but Pending Requests still shows 5!"**
- ❌ OLD BUG: Was counting org-wide PENDING status
- ✅ FIXED: Now counts only YOUR pending approvals
- When you forward → approval moves to DEPT_HEAD
- Your count decreases immediately ✅

**"Avg Approval Time shows 2.3 days but mine are instant!"**
- This is **org-wide average** (all approvers)
- Your personal speed might be faster
- Number shows total time from submission to FINAL approval
- Includes all steps: HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO

**"Team Utilization shows 87% but I see 12 people on leave!"**
- 87% = (100 total employees - 12 on leave) / 100 × 100%
- 87% are AVAILABLE (13 are unavailable)
- Target is ≥85% available

---

## 🔍 Hover Over Every ℹ️ Icon!

Each card has an info icon (ℹ️) in the top-right corner.

**Hover to see:**
- Detailed explanation
- Why the metric matters
- How it's calculated
- Action guidance (where applicable)

**All tooltips follow this structure:**
1. **What this shows:** Plain English description
2. **Why it matters:** Business value and targets
3. **Calculation/Note:** Technical details

---

## 📱 Mobile View

All tooltips are also available on mobile:
- Tap the ℹ️ icon to see the tooltip
- Swipe to dismiss

---

## ✨ Before vs After

### Before (Old Dashboard):
```
Pending Requests: 15
[No explanation]
```
**User thinks:** "I need to process 15 requests!"
**Reality:** Only 3 are yours, rest are at other approvers

### After (Fixed Dashboard):
```
Pending Requests: 3
[ℹ️ Hover: "Requests awaiting YOUR action"]
```
**User thinks:** "I have 3 requests in my queue"
**Reality:** Correct! ✅

---

**Last Updated:** 2025-11-17
**Version:** 2.0 (Phase 2 - Real Metrics + Comprehensive Tooltips)
