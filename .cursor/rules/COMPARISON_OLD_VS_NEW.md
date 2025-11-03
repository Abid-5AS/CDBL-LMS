# Cursor Rule: Old vs New Comparison

## Side-by-Side Comparison

### Role Definitions

| Aspect | ❌ OLD Rule | ✅ NEW Rule |
|--------|-------------|-------------|
| **Roles** | 4 roles (missing HR_HEAD) | 5 complete roles (EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO) |
| **Source** | Generic assumptions | Direct Policy Logic references (09-Role Based Behavior.md) |
| **SUPERADMIN** | Listed but not in schema | Removed (not in Policy v2.0 or schema) |

### Approval Permissions

| Role | ❌ OLD Assumption | ✅ NEW Reality |
|------|------------------|----------------|
| **HR_ADMIN** | Can approve | **Forward only** (Step 1, intermediate) |
| **DEPT_HEAD** | Can approve | Forward for DEFAULT; **Approve/Reject for CASUAL** |
| **HR_HEAD** | Missing | **Final approver** (Step 3) |
| **CEO** | Can approve | **Fallback final approver** (Step 4) |

### Workflow Chains

| Aspect | ❌ OLD Rule | ✅ NEW Rule |
|--------|-------------|-------------|
| **Chain Type** | Single chain | **Per-type chains** (DEFAULT vs CASUAL) |
| **CASUAL** | Same as others | **Shorter chain**: `["DEPT_HEAD"]` |
| **DEFAULT** | Generic | **Full chain**: `["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]` |
| **Source** | Not specified | `lib/workflow.ts` WORKFLOW_CHAINS |

### UI Enforcement

| Feature | ❌ OLD Rule | ✅ NEW Rule |
|---------|-------------|-------------|
| **Component Prefix** | Employee*, HR*, etc. | Uses `getActionsForContext()` from `lib/page-context.ts` |
| **Dashboard Actions** | Generic suggestions | **Actual file locations** and role matrices |
| **FloatingDock** | Not mentioned | **Integrated with page context system** |
| **Conditional Rendering** | Manual checks | **Function-based** via RBAC helpers |

### API Guards

| Guard Type | ❌ OLD Rule | ✅ NEW Rule |
|------------|-------------|-------------|
| **Pattern** | Generic `if (!isRoleAllowed(...))` | **Specific functions**: `canCancel(role, isOwnLeave)` |
| **Location** | Not specified | References `lib/rbac.ts` and `lib/workflow.ts` |
| **Audit Trail** | Mentioned | **Required with role context** |

### Status Awareness

| Status | ❌ OLD Rule | ✅ NEW Rule |
|--------|-------------|-------------|
| **DRAFT** | Not mentioned | ✅ Documented |
| **SUBMITTED** | Not mentioned | ✅ Documented |
| **PENDING** | Not mentioned | ✅ Documented |
| **APPROVED** | Generic | ✅ With cancellation flows |
| **REJECTED** | Generic | ✅ With return flows |
| **CANCELLED** | Generic | ✅ With balance restoration |
| **RETURNED** | ❌ Missing | ✅ **Added** |
| **CANCELLATION_REQUESTED** | ❌ Missing | ✅ **Added** |
| **RECALLED** | ❌ Missing | ✅ **Added** |
| **OVERSTAY_PENDING** | ❌ Missing | ✅ **Added** |

### Cancellation Rules

| Aspect | ❌ OLD Rule | ✅ NEW Rule |
|--------|-------------|-------------|
| **Employee** | Generic | SUBMITTED/PENDING → CANCELLED; APPROVED → CANCELLATION_REQUESTED |
| **HR Roles** | Generic admin override | With **balance restoration** + audit |
| **Permission Check** | Not specified | Uses `canCancel(role, isOwnLeave)` |

### Return for Modification

| Aspect | ❌ OLD Rule | ✅ NEW Rule |
|--------|-------------|-------------|
| **Status** | ❌ Not mentioned | ✅ **RETURNED** documented |
| **Permission** | ❌ Not specified | ✅ Uses `canReturn(role)` |
| **Roles** | ❌ Not clear | ✅ HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD |

### Source of Truth

| Element | ❌ OLD Rule | ✅ NEW Rule |
|---------|-------------|-------------|
| **Policy Docs** | ❌ Not referenced | ✅ Direct refs to Policy Logic docs |
| **RBAC Functions** | ❌ Generic | ✅ Actual functions from `lib/rbac.ts` |
| **Workflow Functions** | ❌ Not mentioned | ✅ Actual functions from `lib/workflow.ts` |
| **Validation** | Manual process | ✅ **Automated**: Read policy → verify → implement |

### Safeguards

| Safeguard | ❌ OLD Rule | ✅ NEW Rule |
|-----------|-------------|-------------|
| **Don't propagate employee actions** | Generic | ✅ Specific: Use `getActionsForContext()` |
| **Don't expose HR APIs** | Generic | ✅ Specific: Guard with `canCancel()`, `canReturn()` |
| **Don't create shared states** | Generic | ✅ Specific: Check `roleContext` via RBAC functions |
| **Confirm authority** | Ask developer | ✅ Reference specific policy clauses |

### Structure

| Feature | ❌ OLD Rule | ✅ NEW Rule |
|---------|-------------|-------------|
| **Format** | JSON only | JSON + **Markdown** |
| **Examples** | None | ✅ **Complete implementation flow** |
| **Common Mistakes** | None | ✅ **6 documented mistakes** |
| **Function Reference** | None | ✅ **Complete API reference** |
| **Dashboard Mapping** | None | ✅ **Actual file paths** |

---

## Key Improvements Summary

### 1. ✅ **Source of Truth Integration**
- Every role, permission, and workflow now references Policy Logic documents
- No assumptions; all rules derived from official docs

### 2. ✅ **Complete Role Matrix**
- Fixed missing HR_HEAD role
- Added 10 status support
- Per-type workflow chains

### 3. ✅ **Real Codebase Alignment**
- Uses actual RBAC functions
- References real file locations
- Follows existing patterns

### 4. ✅ **Preventable Mistakes**
- Documents 6 common mistakes
- Adds critical safeguards
- Provides implementation examples

### 5. ✅ **Developer Experience**
- Clear examples
- Function reference
- Dashboard mapping

---

## Migration Path

### If You're Using the OLD Rule

1. **Delete** old rule from Cursor
2. **Copy** new rule (JSON or Markdown)
3. **Verify** with Policy Logic docs
4. **Test** in development

### Verification Steps

```bash
# Check role enum matches
grep -A 10 "enum Role" prisma/schema.prisma

# Check RBAC functions exist
grep -E "export function can" lib/rbac.ts

# Check workflow chains exist
grep -A 5 "WORKFLOW_CHAINS" lib/workflow.ts

# Check status enum matches
grep -A 15 "enum LeaveStatus" prisma/schema.prisma
```

---

## Testing Checklist

After adopting the NEW rule, verify:

- [ ] All roles match schema: EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO
- [ ] Approval chains respect per-type logic (CASUAL vs DEFAULT)
- [ ] UI actions use `getActionsForContext()` correctly
- [ ] API guards use RBAC functions from `lib/rbac.ts`
- [ ] Cancellation flows handle all 10 statuses
- [ ] Balance restoration works on admin cancel
- [ ] Audit trail logs role context
- [ ] No hardcoded approval sequences

---

**Recommendation**: **Use the NEW rule** — it's fully aligned with Policy v2.0 and your actual codebase.
