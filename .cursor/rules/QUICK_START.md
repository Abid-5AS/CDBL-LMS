# Quick Start Guide: Adopting the Optimized Role Rule

## 🎯 What You Have Now

Three optimized cursor rules aligned with Policy v2.0:

1. **`role-context-enforcement-optimized.json`** - Machine-readable format
2. **`role-context-enforcement-optimized.md`** - Human-readable format  
3. **Supporting docs** - Comparison, alignment, and quick-start guides

---

## 🚀 How to Use

### Option 1: Copy JSON to Cursor

```bash
# Copy the JSON file into your cursor rules
cat .cursor/rules/role-context-enforcement-optimized.json
```

Paste the JSON into Cursor's rules configuration.

### Option 2: Copy Markdown to Cursor

```bash
# Copy the Markdown file into your cursor rules
cat .cursor/rules/role-context-enforcement-optimized.md
```

Paste the Markdown into Cursor's rules configuration.

### Option 3: Reference Files

Keep the files in `.cursor/rules/` and reference them in your main rule file:

```
Reference .cursor/rules/role-context-enforcement-optimized.md for role permissions
```

---

## ✅ Verification Checklist

After adopting the rule, verify alignment:

```bash
# 1. Check roles match schema
grep -A 10 "enum Role" prisma/schema.prisma

# 2. Check RBAC functions exist
grep -E "export function can" lib/rbac.ts

# 3. Check workflow chains exist
grep -A 5 "WORKFLOW_CHAINS" lib/workflow.ts

# 4. Check status enum matches
grep -A 15 "enum LeaveStatus" prisma/schema.prisma

# 5. Verify page context functions exist
grep -A 5 "getActionsForContext" lib/page-context.ts
```

Expected outputs:
- ✅ 5 roles: EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO
- ✅ RBAC functions: canCancel, canReturn, canApprove, etc.
- ✅ WORKFLOW_CHAINS with DEFAULT and CASUAL
- ✅ 10 statuses including RETURNED, CANCELLATION_REQUESTED, etc.
- ✅ getActionsForContext function present

---

## 🧪 Quick Test

Test the rule by asking Cursor to implement a feature:

### Test 1: Add Cancel Action to Employee Dashboard

**Prompt**: "Add a cancel action button to the employee leave requests page that only shows for SUBMITTED or PENDING requests"

**Expected**: Rule enforces:
- Check Policy Logic/09-Role Based Behavior.md first
- Use `canCancel('EMPLOYEE', isOwnLeave)` function
- Only show for own requests
- Handle CANCELLATION_REQUESTED for APPROVED leaves

### Test 2: Guard Approval API

**Prompt**: "Add role checking to the approval endpoint to ensure only final approvers can approve"

**Expected**: Rule enforces:
- Use `isFinalApprover(role, leave.type)` from `lib/workflow.ts`
- Use per-type chains via `getChainFor(type)`
- CASUAL has different chain than DEFAULT

### Test 3: Role-Specific UI Actions

**Prompt**: "Show different actions in the dock based on user role"

**Expected**: Rule enforces:
- Use `getActionsForContext(user.role, pageContext)` from `lib/page-context.ts`
- Don't mix employee/HR features
- Respect role-specific dashboards

---

## 📋 Common Scenarios

### Scenario 1: Adding a New Role Feature

**Before**: ❌ Assume HR_ADMIN can approve  
**After**: ✅ Check Policy docs → verify `isFinalApprover()` → only final step can approve

### Scenario 2: Creating Approval UI

**Before**: ❌ Hardcode role checks  
**After**: ✅ Use `getChainFor(type)` → use `isFinalApprover()` → conditional rendering

### Scenario 3: Guarding API Endpoints

**Before**: ❌ Generic role check  
**After**: ✅ Use `canCancel()`, `canReturn()`, or `isFinalApprover()` based on action

---

## 🔍 When Rule Triggers

The rule activates when you:

1. Modify `app/**`, `components/**`, `lib/**`, or `src/**`
2. Create or edit components, modals, dashboards, or API routes
3. Generate UI elements (docks, control centers)
4. Implement backend/API handlers
5. Add new pages or routes
6. Work with approval workflows

---

## 📚 Additional Resources

- **Full Rule**: `.cursor/rules/role-context-enforcement-optimized.md`
- **Comparison**: `.cursor/rules/COMPARISON_OLD_VS_NEW.md`
- **Alignment Details**: `.cursor/rules/ROLE_RULE_ALIGNMENT_SUMMARY.md`
- **Policy Docs**: `docs/Policy Logic/09-Role Based Behavior.md`
- **RBAC Code**: `lib/rbac.ts`
- **Workflow Code**: `lib/workflow.ts`

---

## 🆘 Troubleshooting

### Issue: Rule doesn't trigger

**Solution**: Check if Cursor recognizes the rule format. Try both JSON and Markdown versions.

### Issue: Rule conflicts with existing rules

**Solution**: Review `.cursor/rules/` and ensure no duplicate role rules. The optimized rule should replace any generic role rules.

### Issue: Missing function references

**Solution**: Verify all referenced functions exist in `lib/rbac.ts` and `lib/workflow.ts`.

---

## 🎓 Next Steps

1. ✅ Copy rule to Cursor
2. ✅ Run verification checklist
3. ✅ Test with scenarios above
4. ✅ Reference Policy Logic docs when implementing
5. ✅ Use RBAC and workflow functions
6. ✅ Follow example implementations in the rule

---

**Ready to use?** Copy the rule and start building role-aware features with confidence! 🚀
