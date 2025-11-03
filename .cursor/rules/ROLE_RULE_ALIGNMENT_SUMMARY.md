# Role Context Enforcement Rule — Policy Alignment Summary

## What Was Optimized

Your original cursor rule has been **completely rewritten and optimized** to align with the **Policy Logic documents** as the absolute source of truth.

## Key Changes

### ✅ Added Source of Truth References

**Before:** Generic role descriptions without policy citations  
**After:** Direct references to Policy Logic documents:
- `docs/Policy Logic/09-Role Based Behavior.md`
- `docs/Policy Logic/06-Approval Workflow and Chain.md`
- `lib/rbac.ts` (RBAC functions)
- `lib/workflow.ts` (workflow chains)

### ✅ Fixed Role Hierarchy

**Before:** Missing `HR_HEAD` role  
**After:** Complete 5-role hierarchy:
1. EMPLOYEE
2. DEPT_HEAD
3. HR_ADMIN
4. HR_HEAD
5. CEO

### ✅ Corrected Approval Permissions

**Before:** Assumed all HR roles could approve  
**After:** Per-type workflow chains:
- **HR_ADMIN**: Forward only (Step 1)
- **DEPT_HEAD**: Forward for DEFAULT, Approve/Reject for CASUAL
- **HR_HEAD**: Final approver (Step 3)
- **CEO**: Fallback final approver (Step 4)

### ✅ Added Missing Status Support

**Before:** Limited status awareness  
**After:** Complete status lifecycle:
- DRAFT, SUBMITTED, PENDING, APPROVED, REJECTED, CANCELLED
- RETURNED, CANCELLATION_REQUESTED, RECALLED, OVERSTAY_PENDING

### ✅ Integrated Real Codebase Functions

**Before:** Generic permission checks  
**After:** Actual function references:
- `canViewAllRequests()`, `canApprove()`, `canCancel()`, `canReturn()`
- `isFinalApprover()`, `getChainFor()`, `canPerformAction()`
- `getActionsForContext()`

### ✅ Added Per-Type Workflow Chains

**Before:** Single approval chain  
**After:** 
- **DEFAULT**: `HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO` (for EL, ML, etc.)
- **CASUAL**: `DEPT_HEAD` (single step)

### ✅ Fixed Cancellation Rules

**Before:** Unclear cancellation permissions  
**After:** 
- Employee can cancel SUBMITTED/PENDING
- Employee can initiate cancellation request for APPROVED
- HR roles can admin-cancel any approved leave with balance restoration

### ✅ Added UI Enforcement Patterns

**Before:** No UI guidance  
**After:** 
- Dashboard locations per role
- FloatingDock action patterns via `getActionsForContext()`
- Conditional rendering examples

## Critical Safeguards Added

From Policy v2.0 docs, added these **mandatory safeguards**:

❌ **NEVER** allow EMPLOYEE to approve ANY requests  
❌ **NEVER** allow HR_ADMIN to approve/reject DEFAULT chain  
❌ **NEVER** allow intermediate roles to APPROVE/REJECT  
❌ **NEVER** hardcode approval sequences  

✅ **ALWAYS** use per-type workflow chains  
✅ **ALWAYS** verify permissions before rendering UI  
✅ **ALWAYS** log role context in audit trail  

## Common Mistakes Documented

Added section to prevent:
1. Assuming HR_ADMIN can approve non-CASUAL
2. Forgetting CASUAL uses different chain
3. Allowing self-approval
4. Mixing employee/HR features
5. Skipping balance restoration
6. Bypassing RBAC checks

## Example Implementation Flow

Added complete example showing how to:
1. Check Policy Logic docs first
2. Verify RBAC functions
3. Add conditional UI actions
4. Guard API handlers
5. Handle status transitions

---

## Files Created

1. **`.cursor/rules/role-context-enforcement-optimized.json`**
   - Machine-readable JSON format
   - Complete role matrix
   - Workflow chains mapping
   - RBAC function references

2. **`.cursor/rules/role-context-enforcement-optimized.md`**
   - Human-readable markdown
   - Quick reference guide
   - Examples and patterns
   - Common mistakes section

3. **`.cursor/rules/ROLE_RULE_ALIGNMENT_SUMMARY.md`** (this file)
   - Alignment documentation
   - Change log

## How to Use

### Option 1: JSON Format
Copy `.cursor/rules/role-context-enforcement-optimized.json` into your Cursor rules if you prefer JSON.

### Option 2: Markdown Format
Copy `.cursor/rules/role-context-enforcement-optimized.md` into your Cursor rules if you prefer markdown.

### Option 3: Both
Use both for redundancy:
- JSON for programmatic parsing (if Cursor supports it)
- Markdown for human reading

## Verification Checklist

Before using this rule, verify:

- [x] All roles match Policy 09-Role Based Behavior.md
- [x] Approval chains match Policy 06-Approval Workflow and Chain.md
- [x] RBAC functions reference actual lib/rbac.ts functions
- [x] Workflow chains match lib/workflow.ts WORKFLOW_CHAINS
- [x] Status lifecycle matches prisma/schema.prisma LeaveStatus enum
- [x] Dashboard locations match actual file structure
- [x] UI enforcement uses lib/page-context.ts patterns
- [x] Safeguards aligned with Policy v2.0 requirements

---

**Status**: ✅ **Full alignment with Policy Logic documents**  
**Version**: 2.0  
**Last Verified**: Against latest Policy Logic docs
