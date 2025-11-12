# Visual Consistency Guidelines for CDBL LMS

## Status Colors (COMPLETED ✅)
### Standardized Status Color Usage

**Tab Colors:**
- All: `bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500`
- Pending: `bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600`
- Approved: `bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600`
- Rejected: `bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600`

**Badge/Status Indicators:**
- Use `StatusBadge` component from `@/components/shared/StatusBadge`
- Avoid custom status implementations

**Design Tokens:**
```css
/* Success States */
--color-data-success: #16a34a (emerald-600)
--color-status-approved: #16a34a (emerald-600)

/* Warning/Pending States */
--color-data-warning: #d97706 (amber-600)
--color-status-submitted: #2563eb (blue-600)
--color-status-returned: #d97706 (amber-600)

/* Error/Rejected States */
--color-data-error: #e11d48 (rose-600)
--color-status-rejected: #e11d48 (rose-600)

/* Info States */
--color-data-info: #0284c7 (sky-600)
```

## Icon Guidelines

### Icon Sizes
Standardize on the following sizes using the `size-*` utility:

- **xs: `size-3` (12px)** - Inline with small text (text-xs)
- **sm: `size-4` (16px)** - Inline with body text (text-sm, text-base)
- **md: `size-5` (20px)** - Card headers, section titles (text-lg)
- **lg: `size-6` (24px)** - Page headers (text-xl, text-2xl)
- **xl: `size-8` (32px)** - Hero sections, empty states (text-3xl+)
- **2xl: `size-12` (48px)** - Large empty states, illustrations

**Prefer `size-*` over `w-* h-*`:**
```tsx
// ✅ Good
<Calendar className="size-4" />

// ❌ Avoid
<Calendar className="w-4 h-4" />
```

### Accessibility
**All decorative icons MUST have `aria-hidden="true"`:**

```tsx
// ✅ Good - Decorative icon
<Calendar className="size-4" aria-hidden="true" />
<Loader2 className="size-4 animate-spin" aria-hidden="true" />

// ✅ Good - Meaningful icon (has label)
<button aria-label="Open calendar">
  <Calendar className="size-5" />
</button>

// ❌ Bad - Missing aria-hidden
<Calendar className="size-4" /> {/* Screen readers will announce "image" */}
```

### Icon Colors
Icons should inherit text color by default:

```tsx
// ✅ Good - Inherits parent color
<div className="text-primary">
  <Calendar className="size-4" />
</div>

// ✅ Good - Explicit color when needed
<Calendar className="size-4 text-data-success" />

// ❌ Avoid - Unnecessary color specification
<Calendar className="size-4 text-foreground" /> {/* Already default */}
```

## Spacing Guidelines

### Grid Gaps
- **`gap-4`** - Dense layouts (4-column+ KPI grids, compact tables)
- **`gap-6`** - Standard layouts (most dashboards, 2-3 column grids)
- **`gap-8`** - Spacious layouts (marketing pages, hero sections)

### Card Padding
Use consistent padding based on card size:

- **`p-4`** - Compact cards (mobile, sidebars)
- **`p-6`** - Standard cards (default, most dashboards)
- **`p-8`** - Large cards (hero sections, feature cards)

**Don't mix padding on Card and CardContent:**
```tsx
// ✅ Good
<Card className="p-6">
  <CardContent>{content}</CardContent>
</Card>

// ❌ Bad - Double padding
<Card className="p-6">
  <CardContent className="p-4">{content}</CardContent>
</Card>
```

### Section Spacing
- **`space-y-4`** - Tight sections (form fields, list items)
- **`space-y-6`** - Standard sections (dashboard sections, page content)
- **`space-y-8`** - Generous sections (major page divisions)

## Typography Guidelines

### Heading Hierarchy
```tsx
// Page titles
<h1 className="text-3xl font-semibold">

// Section headers
<h2 className="text-2xl font-semibold">

// Subsection headers
<h3 className="text-xl font-semibold">

// Card titles
<h4 className="text-lg font-medium">
```

### Text Weights
- **`font-bold`** - Emphasis, callouts (use sparingly)
- **`font-semibold`** - Headings, labels
- **`font-medium`** - Sub-headings, buttons
- **`font-normal`** - Body text (default)

### Text Colors
```tsx
// Primary text (default)
className="text-foreground"

// Secondary/muted text
className="text-muted-foreground"

// Error text
className="text-data-error"

// Success text
className="text-data-success"

// Warning text
className="text-data-warning"
```

## Shadow Guidelines

### Shadow Hierarchy
- **`shadow-sm`** - Standard cards, subtle elevation
- **`shadow-md`** - Interactive cards, hover states
- **`shadow-lg`** - Modals, dropdowns, popovers
- **`shadow-xl`** - High-priority overlays, sheets

**Usage:**
```tsx
// Standard card
<Card className="shadow-sm">

// Card with hover
<Card className="shadow-sm hover:shadow-md transition-shadow">

// Modal
<Dialog className="shadow-lg">
```

## Border Guidelines

### Border Widths
- **`border`** (1px) - Default for most UI elements
- **`border-2`** (2px) - Emphasized buttons (outline variant), focused inputs
- **`border-0`** - Explicitly remove borders

### Border Colors
Always use design tokens:

```tsx
// Standard border
className="border border-border"

// Emphasized border
className="border-2 border-primary"

// Destructive border
className="border border-data-error"
```

## Card Background Guidelines

### Opacity Values
- **`bg-card`** - Standard cards (no opacity, default)
- **`bg-card/95`** - Sticky/fixed elements (navbar, headers)
- **`bg-card/90`** - Glass effect cards (special designs)
- **`bg-card/50`** - Subtle overlays (use sparingly)

## Button Guidelines

### Variant Usage
```tsx
// Primary actions (submit, save, create)
<Button variant="default">Submit</Button>

// Secondary actions (cancel, back)
<Button variant="outline">Cancel</Button>

// Destructive actions (delete, reject)
<Button variant="destructive">Delete</Button>

// Subtle actions (links, navigation)
<Button variant="ghost">Learn More</Button>

// Link-style buttons
<Button variant="link">View Details</Button>
```

### Loading States
Always use the built-in loading prop:

```tsx
// ✅ Good
<Button loading={isSubmitting} loadingText="Submitting...">
  Submit
</Button>

// ❌ Bad - Manual spinner
<Button disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="animate-spin" />}
  Submit
</Button>
```

## Status Badge Guidelines

Always use the `StatusBadge` component:

```tsx
import { StatusBadge } from "@/components/shared/StatusBadge";

// ✅ Good
<StatusBadge status="PENDING" />
<StatusBadge status="APPROVED" />
<StatusBadge status="REJECTED" />

// ❌ Bad - Custom implementation
<span className="bg-green-50 text-green-700">Approved</span>
```

## Color Consistency Checklist

Before adding colors to components, check:

1. ✅ Is there a design token for this semantic meaning?
2. ✅ Does it support dark mode properly?
3. ✅ Is the color accessible (sufficient contrast)?
4. ✅ Is it consistent with similar components?
5. ✅ Can I use a semantic class instead? (text-data-success vs text-green-600)

## Common Mistakes to Avoid

### ❌ Don't Do This
```tsx
// Hardcoded colors
className="bg-blue-500 text-white"

// Mixed syntax for same thing
className="w-4 h-4" // vs size-4

// Missing accessibility
<Icon className="size-4" /> // Missing aria-hidden

// Inconsistent spacing
<div className="grid gap-4"> // Next component uses gap-6

// Double padding
<Card className="p-6">
  <CardContent className="p-4">

// Custom status badges
<span className="bg-red-50 text-red-700">Rejected</span>
```

### ✅ Do This Instead
```tsx
// Use design tokens
className="bg-primary text-primary-foreground"

// Consistent syntax
className="size-4"

// Add accessibility
<Icon className="size-4" aria-hidden="true" />

// Consistent spacing
<div className="grid gap-6">

// Single padding layer
<Card className="p-6">
  <CardContent>

// Use StatusBadge component
<StatusBadge status="REJECTED" />
```

## Migration Checklist

When refactoring components for visual consistency:

- [ ] Replace hardcoded colors with design tokens
- [ ] Standardize icon sizes to `size-*` utilities
- [ ] Add `aria-hidden="true"` to decorative icons
- [ ] Use consistent spacing (gap-6 for grids, space-y-6 for sections)
- [ ] Ensure card padding is consistent (p-6 default)
- [ ] Use StatusBadge for all status indicators
- [ ] Check shadow usage (shadow-sm default)
- [ ] Verify border styling (border border-border)
- [ ] Test in both light and dark modes
- [ ] Verify accessibility with keyboard navigation

---

**Last Updated:** 2025-11-12
**Version:** 1.0
**Status:** Living Document - Update as design system evolves
