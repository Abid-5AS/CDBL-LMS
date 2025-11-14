# Standardized Dashboard Color System

## Overview

This document describes the standardized color system applied across all dashboards and cards in the CDBL Leave Management System. The system follows Material Design 3 and modern UX principles with a focus on accessibility (WCAG AA compliance), clear visual hierarchy, and consistent interaction patterns.

## System Structure

### 1. Depth Layers

**Base Layer (Darkest)**
- **Light mode**: `#ffffff` (true white canvas)
- **Dark mode**: `#09090b` (true black)
- This is the page background everything sits on top of

**Card Layer (Elevated)**
- **Light mode**: `#ffffff` (main cards float above base)
- **Dark mode**: `#121216` (slightly lighter than base)
- Cards should feel elevated with proper shadow and border treatment

**Semantic CSS Variables**:
```css
--color-base-darkest    /* Page background */
--color-base-dark       /* Section backgrounds */
--color-card-elevated   /* Main card surfaces */
--color-card-elevated-subtle /* Nested/secondary cards */
--color-card-hover      /* Card on hover state */
--color-card-pressed    /* Card when pressed/active */
```

---

## 2. Text Contrast Hierarchy

All text must meet WCAG AA minimum contrast ratios:

| Level | Use Case | Light Mode | Dark Mode | CSS Variable |
|-------|----------|-----------|-----------|--------------|
| **Primary** | Headings, main numbers, critical info | `#0b1220` | `#fafafa` | `--color-text-primary` |
| **Secondary** | Labels, descriptions, secondary info | `#334155` | `#d4d4d8` | `--color-text-secondary` |
| **Tertiary** | Metadata, timestamps, less important | `#64748b` | `#a1a1a6` | `--color-text-tertiary` |
| **Muted** | Placeholders, disabled, very subtle | `#94a3b8` | `#71717a` | `--color-text-muted` |
| **Inverted** | Text on dark backgrounds (dark cards/modals) | `#ffffff` | `#09090b` | `--color-text-inverted` |

**Usage Pattern**:
```jsx
<h1 className="text-text-primary">Main Heading</h1>
<p className="text-text-secondary">Supporting text</p>
<span className="text-text-muted">Disabled or subtle</span>
```

---

## 3. Surface Colors

**Full Background Stack**:

```css
--color-bg-primary      /* Page/canvas background */
--color-bg-secondary    /* Section/panel backgrounds */
--color-bg-tertiary     /* Interactive surfaces, hover states */
--color-bg-muted        /* Subtle borders, skeleton screens */
--color-bg-inverted     /* Overlay/dark backgrounds */
```

**Light Mode Palette**:
- Primary: `#ffffff` (white canvas)
- Secondary: `#f8fafc` (slate-50)
- Tertiary: `#eef2f7` (soft neutral)
- Muted: `#e5eaf1` (subtle borders)

**Dark Mode Palette**:
- Primary: `#09090b` (true black)
- Secondary: `#0f0f12` (zinc-950)
- Tertiary: `#18181b` (zinc-900)
- Muted: `#27272a` (zinc-800)

---

## 4. Brand & Primary Accent

**Primary Action Color** - Blue/Indigo for main CTAs

```css
--color-brand           /* #4f46e5 light, #818cf8 dark */
--color-brand-soft      /* #e7e9ff light, #1f235a dark */
--color-brand-strong    /* #3730a3 light, #c7d2fe dark */
```

**Usage**:
- Primary buttons
- Links
- Active states
- Focus rings
- Accent borders on hover

---

## 5. Interactive State Colors

### Hover States
```css
--color-interactive-hover-border  /* Accent color for borders */
--color-interactive-hover-bg      /* Soft accent background */
```

**Implementation**:
- Cards should translate up 2px on hover
- Border color changes to accent color
- Box shadow elevation increases by 1 level
- Smooth 0.2-0.3s transition

### Focus States
```css
--color-interactive-focus-ring    /* Focus outline color */
```

**Implementation**:
- 2px solid outline
- 2px offset
- Color: Primary accent

### Active/Pressed States
```css
--color-interactive-active        /* Active state color */
--color-interactive-disabled      /* Disabled state (muted) */
```

**Implementation**:
- Return to base elevation (no transform)
- Slight background darkening
- Disabled: 0.6 opacity + muted color

---

## 6. Action Buttons

### Three Button Types

**Primary Action Button** (CTA - Call to Action)
```css
--color-brand                 /* Background */
--color-text-inverted         /* Text color */
```
- Bright, saturated accent color
- Use sparingly for main actions
- `.btn-primary` utility class

**Secondary Action Button** (Less Important)
```css
--color-action-secondary      /* Text color */
--color-action-secondary-bg   /* Background color */
```
- Muted gray for secondary buttons
- Neutral appearance
- `.btn-secondary` utility class

**Destructive Action Button** (Danger/Delete)
```css
--color-action-destructive    /* Red #dc2626 light, #ef4444 dark */
--color-action-destructive-soft /* Soft background */
```
- Clear warning for dangerous actions
- Red/warm accent
- `.btn-destructive` utility class

---

## 7. Data State Colors

Used for status indicators, badges, and feedback

### Success/Positive
```css
--color-data-success       /* #16a34a (emerald-600) */
--color-data-success-soft  /* #dcfce7 (emerald-100) */
```
- Confirmed, approved, positive actions

### Warning/Caution
```css
--color-data-warning       /* #d97706 (amber-600) */
--color-data-warning-soft  /* #fef3c7 (amber-100) */
```
- Attention needed, pending, caution required

### Error/Failure
```css
--color-data-error         /* #dc2626 (red-600) */
--color-data-error-soft    /* #fee2e2 (red-100) */
```
- Errors, failures, rejection

### Info/Informational
```css
--color-data-info          /* #0284c7 (sky-600) */
--color-data-info-soft     /* #e0f2fe (sky-100) */
```
- General information, notifications

---

## 8. Leave Type Colors

Specific colors for different leave categories:

```css
--color-leave-earned      /* #16a34a - Accrued/earned */
--color-leave-casual      /* #2563eb - Regular/flexible time off */
--color-leave-medical     /* #0ea5e9 - Medical purposes */
--color-leave-sick        /* #dc2626 - Illness/health related */
--color-leave-unpaid      /* #6b7280 - No pay benefit */
--color-leave-maternity   /* #db2777 - Maternity benefit */
--color-leave-paternity   /* #7c3aed - Paternity benefit */
```

---

## 9. Icon Treatment

Icons should match the contrast of their associated text:

```css
--color-icon-primary      /* Highest contrast */
--color-icon-secondary    /* Medium contrast */
--color-icon-muted        /* Subtle/decorative */
--color-icon-accent       /* Active/important */
--color-icon-success      /* Success state */
--color-icon-warning      /* Warning state */
--color-icon-error        /* Error state */
--color-icon-info         /* Info state */
```

**Rules**:
- Primary icons: Use same color as primary text
- Secondary icons: Use same color as secondary text
- Decorative icons: Use muted color
- Active/important: Use brand/accent color
- Status icons: Use status color (success/error/warning/info)

---

## 10. Status/UI State Colors

Request and process lifecycle colors:

```css
--color-status-draft      /* #6b7280 - Not yet submitted */
--color-status-submitted  /* #2563eb - Awaiting review */
--color-status-approved   /* #16a34a - Confirmed/Accepted */
--color-status-rejected   /* #dc2626 - Denied/Not approved */
--color-status-returned   /* #d97706 - Needs revision */
--color-status-cancelled  /* #94a3b8 - Voided/Not applicable */
```

---

## 11. Card Categories

**KPI Cards** - Key Performance Indicators
```css
--color-card-kpi        /* #b45309 (amber-700) */
--color-card-kpi-soft   /* #fff7ed (amber-50) */
```

**Action Cards** - Interactive/Actionable Content
```css
--color-card-action     /* var(--color-brand) */
--color-card-action-soft /* var(--color-brand-soft) */
```

**Summary Cards** - Overview/Summary Content
```css
--color-card-summary    /* #7c3aed (violet-600) */
--color-card-summary-soft /* #f3e8ff (violet-100) */
```

---

## 12. Utility Classes

### Surface Cards
```jsx
<!-- Basic card with hover effect -->
<div className="surface-card">Content</div>

<!-- Interactive card (clickable) -->
<div className="surface-card-interactive">Click me</div>

<!-- Muted surface (subdued) -->
<div className="surface-muted">Subtle content</div>
```

### Button Classes
```jsx
<!-- Primary CTA button -->
<button className="btn-primary">Save Changes</button>

<!-- Secondary action button -->
<button className="btn-secondary">Cancel</button>

<!-- Destructive/danger button -->
<button className="btn-destructive">Delete</button>
```

### Interactive Cards
```jsx
<!-- Card that responds to hover/focus -->
<div className="card-interactive">Interactive content</div>
```

---

## Implementation Guide

### Step 1: Replace All Hardcoded Colors

Find and replace non-semantic colors with semantic tokens:

```jsx
// ❌ Before (hardcoded)
<div className="text-slate-900 dark:text-white bg-slate-50">...</div>

// ✅ After (semantic)
<div className="text-text-primary dark:text-text-inverted bg-bg-secondary">...</div>
```

### Step 2: Ensure Proper Text Contrast

Always pair text with appropriate background using the hierarchy:

```jsx
// ✅ Good contrast (primary text on light bg)
<div className="bg-bg-secondary text-text-primary">...</div>

// ✅ Good contrast (secondary text with visual distinction)
<div className="text-text-secondary">Supporting info</div>

// ❌ Poor (primary text on secondary bg - okay, still has contrast)
// ❌ Poor (tertiary text on tertiary bg - no contrast)
```

### Step 3: Apply Interactive States

All interactive elements need proper hover/active/focus states:

```jsx
// ✅ Good - uses interactive state colors
<button className="bg-brand hover:bg-brand-strong focus:ring-brand-soft">
  Action
</button>

// ✅ Good - card with hover effect
<div className="surface-card-interactive hover:border-brand">
  Click me
</div>
```

### Step 4: Use Status Colors Appropriately

Match colors to meaning:

```jsx
// ✅ Success state
<span className="text-data-success bg-data-success-soft">Approved</span>

// ✅ Warning state
<span className="text-data-warning bg-data-warning-soft">Pending</span>

// ✅ Error state
<span className="text-data-error bg-data-error-soft">Rejected</span>
```

---

## Accessibility Checklist

- [ ] All text colors meet WCAG AA minimum contrast (4.5:1 for body, 3:1 for large)
- [ ] Color is never the only way to convey information (use icons/text too)
- [ ] Focus states are clearly visible (outline or background change)
- [ ] Disabled states are visually distinct (opacity + color change)
- [ ] Status indicators use both color AND icons/text
- [ ] Hover states have smooth transitions (0.2-0.3s)
- [ ] Tested in both light and dark modes
- [ ] Works with common colorblind vision types

---

## Light & Dark Mode

All colors are automatically adjusted in dark mode. The CSS uses the `.dark` class selector:

```css
:root {
  /* Light mode values */
}

.dark {
  /* Dark mode values */
}
```

**No additional code needed** - just use the semantic color names and they'll automatically adjust.

---

## Color Variable Summary

Total semantic color tokens: 94

| Category | Count | Examples |
|----------|-------|----------|
| Layer & Surfaces | 10 | base, card, bg-* |
| Text Hierarchy | 5 | text-primary, text-secondary, etc. |
| Accents & Actions | 8 | brand, action-* |
| States | 4 | interactive-hover, interactive-active, etc. |
| Data States | 12 | success, warning, error, info (3 variants each) |
| Leave Types | 7 | earned, casual, medical, sick, etc. |
| Card Categories | 9 | kpi, action, summary (3 variants each) |
| UI Status | 6 | draft, submitted, approved, rejected, etc. |
| Icons | 8 | primary, secondary, success, error, etc. |
| Borders & Shadows | 5 | border-soft, shadow-1, etc. |
| **Total** | **94** | |

---

## Migration Notes

### Removed Files
- ✅ `styles/semantic-colors.css` - Duplicate/conflicting definitions removed

### Updated Files
- ✅ `styles/theme.css` - Enhanced with layered color system
- ✅ `app/globals.css` - Added interactive state utilities and button classes
- ✅ `components/dashboards/employee/components/*.tsx` - Migrated to semantic colors

### Files Ready for Further Updates
- All other dashboard components should follow the same pattern
- Use this guide as reference for any new components

---

## Key Design Principles Applied

1. **Depth through brightness**: Darker = further back, lighter = closer to user
2. **Consistency**: Same interaction patterns get same visual treatment
3. **Hierarchy**: Most important = highest contrast
4. **Accessibility**: All text meets WCAG AA standards minimum
5. **Restraint**: Accent colors used sparingly to maintain impact
6. **Semantics**: Colors convey meaning (green=success, red=error, etc.)

---

## Testing

To verify the color system:

1. **Light Mode**: Check all colors display correctly in light theme
2. **Dark Mode**: Toggle to dark mode and verify automatic color switching
3. **Contrast**: Use browser DevTools accessibility checker
4. **Interaction**: Hover over buttons/cards to see state changes
5. **Accessibility**: Test with color blindness simulator (Accessibility Inspector)

---

## Questions?

Refer to this guide when:
- Adding new components
- Styling cards or dashboards
- Creating status indicators
- Implementing interactive elements
- Ensuring accessibility

The system is designed to be self-documenting through consistent semantic naming.
