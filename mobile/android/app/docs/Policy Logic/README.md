# 🏛️ CDBL Leave Management – Policy & Logic Reference

## Complete Documentation Index

This directory contains a comprehensive extraction of all policy logic, business rules, and validation conditions from the CDBL Leave Management codebase.

---

## 📚 Document Structure

### Part 1: [Leave Types and Entitlements](./01-Leave-Types-and-Entitlements.md)
- All leave types (EARNED, CASUAL, MEDICAL, etc.)
- Entitlement rules and annual limits
- Accrual mechanisms
- Carry-forward rules

### Part 2: [Leave Application Rules and Validation](./02-Leave-Application-Rules-and-Validation.md)
- Required fields and validations
- Date validation logic
- Advance notice requirements
- Minimum/maximum leave length
- Backdate rules

### Part 3: [Holiday and Weekend Handling](./03-Holiday-and-Weekend-Handling.md)
- Weekend detection (Friday/Saturday)
- Holiday detection and management
- Date restrictions
- Weekend/holiday counting rules

### Part 4: [Leave Balance and Accrual Logic](./04-Leave-Balance-and-Accrual-Logic.md)
- Balance calculation formulas
- Accrual mechanisms
- Carry-forward logic
- Annual caps and limits

### Part 5: [File Upload and Medical Certificate Rules](./05-File-Upload-and-Medical-Certificate-Rules.md)
- Medical certificate requirements
- File type and size validation
- Upload and storage logic

### Part 6: [Approval Workflow and Chain](./06-Approval-Workflow-and-Chain.md)
- Approval chain order
- Role-based permissions
- Status transitions
- Workflow logic

### Part 7: [Cancellation and Modification Rules](./07-Cancellation-and-Modification-Rules.md)
- Cancellation conditions
- Balance restoration (not implemented)
- Modification support

### Part 8: [Date Time and Display Logic](./08-Date-Time-and-Display-Logic.md)
- Date formatting (dd/mm/yyyy)
- Timezone assumptions
- Date calculations
- Display formats

### Part 9: [Role Based Behavior](./09-Role-Based-Behavior.md)
- Role hierarchy
- Permission matrix
- Role-specific dashboards
- Access restrictions

### Part 10: [System Messages and Error Handling](./10-System-Messages-and-Error-Handling.md)
- All error codes and messages
- Validation messages
- Warning messages
- Success messages

### Part 11: [Miscellaneous Business Rules](./11-Miscellaneous-Business-Rules.md)
- Implicit rules and assumptions
- Fallback behavior
- Edge cases
- Missing implementations

### Part 12: [Source Mapping Index](./12-Source-Mapping-Index.md)
- Complete file-to-feature mapping
- Line number references
- Quick lookup guide

---

## 🔍 How to Use This Documentation

### For Policy Review
1. Start with Part 1 to understand leave types
2. Review Part 2 for application rules
3. Check Part 10 for exact error messages
4. Use Part 12 to trace implementations

### For Code Audit
1. Use Part 12 to find relevant files
2. Reference specific parts for rule context
3. Compare documented rules with actual code

### For Testing
1. Use Part 2 for validation test cases
2. Reference Part 10 for expected error messages
3. Check Part 11 for edge cases

---

## 📊 Statistics

- **Total Policy Rules Extracted**: 100+ individual rules
- **Unique Files Referenced**: 50+ source files
- **Policy Sections Documented**: 12 major categories
- **Error Codes Cataloged**: 24 unique error codes
- **Validation Messages**: 30+ user-facing messages

---

## ⚠️ Known Gaps / Missing Implementations

Several documented features are not fully implemented:

1. **Automatic EL Accrual**: Monthly job not implemented
2. **Balance Update on Approval**: Logic not found in approval endpoint
3. **Balance Restoration on Cancel**: Not implemented
4. **Year Transition**: Carry-forward and CL lapse not automated
5. **Overstay Detection**: Not implemented
6. **Return-to-Duty Workflow**: Not implemented
7. **Cancellation Audit Logging**: Missing

See Part 11 for complete list of gaps.

---

## 📝 Notes

- All rules extracted from **actual codebase** (not policy manual only)
- Line numbers reference current codebase state
- Some features documented in policy docs but not implemented
- Policy version tracked: **v1.1**

---

## 🔗 Related Documentation

- **HR Policy Manual**: `docs/LeavePolicy_CDBL.md`
- **Implementation Map**: `docs/Policy_Implementation_Map.md`
- **Validation Rules**: `docs/Validation_Rules.md`
- **Workflow Spec**: `docs/Workflow_Spec.md`

---

**Last Updated**: Generated from codebase analysis  
**Policy Version**: v1.1  
**Codebase Version**: Current (as of extraction date)

---

## ⚠️ Contradictions with Source of Truth

**See**: [CONTRADICTIONS_REPORT.md](./CONTRADICTIONS_REPORT.md) for detailed analysis

**Critical Contradictions Identified**:
1. **EL Annual Entitlement**: SourceOfTruth.md says **24 days/year**, system implements **20 days/year**
2. **EL Advance Notice**: SourceOfTruth.md says **≥5 working days**, system enforces **15 days minimum**
3. **CL Approval Chain**: SourceOfTruth.md suggests CL bypasses normal chain, system treats all leaves the same

**Action Required**: Review contradictions report and clarify with HR before production deployment.

