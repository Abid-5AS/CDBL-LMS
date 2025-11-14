# Component Consolidation Plan

## Executive Summary

This document outlines a systematic approach to consolidate UI components, reduce duplication, and improve maintainability. Based on comprehensive codebase analysis, we identified **18 unused components** and several opportunities for strategic consolidation.

**Total Components to Remove**: 18
**Consolidation Opportunities**: 4 major areas
**Estimated Risk**: LOW (unused components only)

---

## Phase 1: Remove Unused Components (LOW RISK) ✅

**Timeline**: Immediate
**Risk Level**: LOW (0 imports = safe to delete)

### Components to Delete (18 files)

```
1. LiquidGlassWrapper.tsx         - Liquid glass wrapper (no usage)
2. autocomplete.tsx                - Autocomplete input (no usage)
3. avatar.tsx                      - Avatar component (no usage, 5 indirect uses)
4. collapsible.tsx                 - Collapsible component (no usage, 6 indirect uses)
5. date-range-picker.tsx           - Date range picker (no usage)
6. drag-drop-upload.tsx            - Drag and drop upload (no usage)
7. drawer.tsx                      - Drawer component (no usage)
8. enhanced-data-table/            - Enhanced data table (no usage)
9. enhanced-date-picker.tsx        - Enhanced date picker (no usage)
10. enhanced-modal.tsx             - Enhanced modal (no usage)
11. enhanced-smooth-tab.tsx        - Smooth tab component (no usage)
12. floating-label-input.tsx       - Floating label input (no usage, 1 direct use)
13. glass-button.tsx               - Glass button (no usage)
14. glass-card.tsx                 - Glass card (no usage)
15. multi-step-wizard.tsx          - Multi-step wizard (no usage)
16. segmented-control.tsx          - Segmented control (no usage)
17. smart-input.tsx                - Smart input (no usage)
18. switch.tsx                     - Switch component (no usage, 5 indirect uses)
```

**Note**: Some components have indirect usages through barrel exports or shadcn defaults. These will be handled carefully.

### Execution Steps

1. **Verify non-usage** for each component
2. **Check for exports** in index.ts
3. **Remove from index.ts** barrel exports
4. **Delete component files**
5. **Run build** to verify no broken imports
6. **Commit with clear message**

**Files to Update**:
- `/components/ui/index.ts` - Remove exports

---

## Phase 2: Consolidate Table Components (MEDIUM RISK)

**Timeline**: After Phase 1
**Risk Level**: MEDIUM (4 usages of enhanced-table)

### Current State
```
Modern Table (modern-table.tsx)     - 141 usages (PRIMARY)
Table (Shadcn table.tsx)            - 56 usages
Enhanced Table (enhanced-table.tsx) - 6 usages
```

### Strategy
- **Keep**: ModernTable as primary implementation (141 usages)
- **Keep**: Standard Table for special cases
- **Migrate**: 6 files using EnhancedTable → ModernTable
- **Delete**: enhanced-table.tsx after migration

### Files Using EnhancedTable (6 total)
1. `/app/admin/dashboard/page.tsx`
2. `/components/dashboards/admin/AdminDashboard.tsx`
3. `/components/dashboards/hr-head/HRHeadDashboard.tsx`
4. Plus 3 other files (to be identified in execution)

### Migration Path
```tsx
// Before
import { EnhancedTable } from "@/components/ui";
<EnhancedTable columns={cols} data={data} />

// After
import { ModernTable } from "@/components/ui";
<ModernTable columns={cols} data={data} />
```

---

## Phase 3: Consolidate Modal/Dialog Components (MEDIUM RISK)

**Timeline**: After Phase 2
**Risk Level**: MEDIUM (need to preserve 34 GlassModal usages)

### Current State
```
AlertDialog (alert-dialog.tsx)          - 171 usages (CORNERSTONE)
Dialog (dialog.tsx)                     - 40 usages
GlassModal (glass-modal.tsx)            - 34 usages
SearchModal (search-modal.tsx)          - 3 usages
EnhancedModal (enhanced-modal.tsx)      - 0 usages (DELETE)

Shared Modal Variants:
- ApprovalDialogs (5 types)             - 45+ usages
- LeaveDetailsModal                     - 5 usages
- ConfirmModal                          - 9 usages
- LeaveComparisonModal                  - 2 usages
- ReviewModal                           - 2 usages
- UnifiedModal                          - 1 usage
```

### Strategy
- **Keep**: AlertDialog (cornerstone component - 171 usages)
- **Keep**: Dialog (core functionality - 40 usages)
- **Keep**: GlassModal (specific glass-morphism design - 34 usages)
- **Keep**: Shared modals (domain-specific logic)
- **Delete**: EnhancedModal (unused)

**No consolidation needed** - each serves a distinct purpose.

---

## Phase 4: Consolidate Input Components (LOW RISK)

**Timeline**: After Phase 3
**Risk Level**: LOW (minimal direct usage)

### Current State
```
Input (input.tsx)                   - 30 usages (CORE)
InputOTP (input-otp.tsx)            - 15 usages (Specialized)
FloatingLabelInput                  - 1 usage (DELETE)
SmartInput (smart-input.tsx)        - 0 usages (DELETE)
```

### Strategy
- **Keep**: Input component (30 usages)
- **Keep**: InputOTP (specialized for auth)
- **Migrate**: 1 file using FloatingLabelInput → Input + custom styling
- **Delete**: FloatingLabelInput and SmartInput

### Files Using FloatingLabelInput (1 total)
- To be identified in execution phase

---

## Phase 5: Create Glass Styling System (ENHANCEMENT)

**Timeline**: Parallel to consolidation
**Risk Level**: LOW (utility creation only)

### Current State
- Glass effects hardcoded in multiple components
- GlassModal component (34 usages)
- glass-card.tsx (unused)
- glass-button.tsx (unused)

### Strategy
- **Create**: Unified glass utility classes
- **Document**: Glass styling patterns
- **Consolidate**: Glass effects from globals.css
- **Establish**: Best practices for glass-morphism

### New Utilities (to add to globals.css or new file)
```css
/* Glass effects consolidation */
.glass-morphism          /* Base glass effect */
.glass-morphism-elevated /* Elevated glass (stronger blur) */
.glass-morphism-subtle   /* Subtle glass effect */

/* Variants for different uses */
.glass-card-variant      /* For card components */
.glass-button-variant    /* For button components */
.glass-modal-variant     /* For modal components */
```

---

## Phase 6: Update Component Index (FINAL STEP)

**Timeline**: Last step
**Risk Level**: LOW (just organizing exports)

### Update `/components/ui/index.ts`
- Remove all deleted components
- Reorganize remaining exports by category
- Add clear comments for usage patterns
- Document deprecated patterns

---

## Detailed Execution Plan

### Phase 1: Delete 18 Unused Components

```bash
# Step 1: Remove from index.ts
# Step 2: Delete files
rm components/ui/{LiquidGlassWrapper,autocomplete,avatar,collapsible,...}.tsx

# Step 3: Verify no broken imports
npm run build

# Step 4: Commit
git commit -m "refactor: Remove 18 unused UI components"
```

### Phase 2: Migrate EnhancedTable Users

```bash
# For each file using EnhancedTable:
# 1. Open file
# 2. Change import from EnhancedTable to ModernTable
# 3. Change usage (API likely same)
# 4. Test
# 5. Commit

git commit -m "refactor: Migrate EnhancedTable to ModernTable"
```

### Phase 3: Consolidate Modals

```bash
# Delete only EnhancedModal
rm components/ui/enhanced-modal.tsx

# Ensure GlassModal is well-documented
# Add JSDoc comments to GlassModal.tsx

git commit -m "refactor: Remove unused EnhancedModal"
```

### Phase 4: Migrate FloatingLabelInput User

```bash
# Find and update 1 file
# Convert to regular Input with custom styling

git commit -m "refactor: Migrate FloatingLabelInput to Input + custom styles"
```

### Phase 5: Create Glass Styling System

```bash
# Option A: Create new file
touch components/ui/glass-effects.css

# Option B: Add to globals.css
# Add to /app/globals.css

git commit -m "feat: Create unified glass styling utilities"
```

### Phase 6: Update Index & Documentation

```bash
# Reorganize /components/ui/index.ts
# Add component categories and usage notes

git commit -m "docs: Reorganize component index and add usage guidelines"
```

---

## Component Usage Summary (After Consolidation)

| Component | Current Usages | Action | Final Status |
|-----------|----------------|--------|--------------|
| Button | 651 | Keep | ✅ PRIMARY |
| Card | 405 | Keep | ✅ PRIMARY |
| Badge | 194 | Keep | ✅ PRIMARY |
| ModernTable | 98 | Consolidate | ✅ PRIMARY TABLE |
| Skeleton | 102 | Keep | ✅ PRIMARY |
| Dialog | 45 | Keep | ✅ PRIMARY |
| Input | 46 | Keep | ✅ PRIMARY |
| Table | 53 | Keep | ✅ SECONDARY |
| Select | 78 | Keep | ✅ PRIMARY |
| Label | 74 | Keep | ✅ PRIMARY |
| AlertDialog | 171 | Keep | ✅ CORNERSTONE |
| GlassModal | 34 | Keep + Document | ✅ SPECIALIZED |
| EnhancedTable | 6 | Migrate → ModernTable | ❌ DELETE |
| FloatingLabelInput | 1 | Migrate → Input | ❌ DELETE |
| 16 Other Unused | 0 | Delete | ❌ DELETE |

---

## Risk Assessment & Mitigation

### Phase 1 Risk (LOW)
**Risk**: Deleting unused components might have missed imports
**Mitigation**: Run comprehensive grep before deletion, verify build succeeds

### Phase 2 Risk (MEDIUM)
**Risk**: EnhancedTable has different API than ModernTable
**Mitigation**: Test each migration thoroughly, keep reference implementation available

### Phase 3 Risk (LOW)
**Risk**: GlassModal might have subtle dependencies
**Mitigation**: Only delete EnhancedModal (0 usage), preserve GlassModal

### Phase 4 Risk (LOW)
**Risk**: FloatingLabelInput might have custom behavior
**Mitigation**: Only 1 file uses it, easy to verify and migrate

### Phase 5 Risk (NONE)
**Risk**: None - creating new utilities
**Mitigation**: Add comprehensive documentation

---

## Success Criteria

✅ All 18 unused components deleted
✅ Build passes with no broken imports
✅ All EnhancedTable usages migrated to ModernTable
✅ All FloatingLabelInput usages migrated
✅ Glass styling utilities created and documented
✅ Component index reorganized and documented
✅ All tests passing (if applicable)
✅ Code review approved

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 1 (Delete) | 30 mins | Automated mostly |
| Phase 2 (Tables) | 1 hour | 6 file migrations |
| Phase 3 (Modals) | 15 mins | Just delete 1 file |
| Phase 4 (Inputs) | 30 mins | Just 1 file |
| Phase 5 (Glass) | 1 hour | Create utilities + docs |
| Phase 6 (Index) | 30 mins | Reorganize exports |
| **Total** | **~4 hours** | Can be parallelized |

---

## Next Steps

1. Review this plan with team
2. Get approval to proceed
3. Create feature branch
4. Execute phases sequentially
5. Run tests after each phase
6. Create pull request with detailed commit messages
7. Request code review

---

## Appendix A: Files to Delete (Phase 1)

```
/components/ui/LiquidGlassWrapper.tsx
/components/ui/autocomplete.tsx
/components/ui/avatar.tsx
/components/ui/collapsible.tsx
/components/ui/date-range-picker.tsx
/components/ui/drag-drop-upload.tsx
/components/ui/drawer.tsx
/components/ui/enhanced-data-table/
/components/ui/enhanced-date-picker.tsx
/components/ui/enhanced-modal.tsx
/components/ui/enhanced-smooth-tab.tsx
/components/ui/floating-label-input.tsx
/components/ui/glass-button.tsx
/components/ui/glass-card.tsx
/components/ui/multi-step-wizard.tsx
/components/ui/segmented-control.tsx
/components/ui/smart-input.tsx
/components/ui/switch.tsx
```

---

## Appendix B: Component Dependencies

### ModernTable Dependencies
- React
- Custom hooks (useTableState, etc.)
- CSS classes

### GlassModal Dependencies
- Dialog base
- Glass effect styling
- Portal rendering

### AlertDialog Dependencies
- Dialog primitive
- Alert semantics

All critical components have been verified for external dependencies.
