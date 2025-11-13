# Design System Guide

This document outlines the design system for the CDBL Leave Management System. **Follow these guidelines strictly** to maintain visual consistency across the application.

## Color System

### Semantic Color Tokens

**CRITICAL:** Always use semantic color tokens, NEVER hardcoded colors or arbitrary Tailwind classes.

#### Text Colors

```tsx
// ✅ CORRECT - Use semantic tokens
<p className="text-foreground">Primary text</p>
<p className="text-muted-foreground">Secondary text</p>

// ❌ WRONG - Don't use these deprecated tokens
<p className="text-text-primary">...</p>
<p className="text-text-secondary">...</p>

// ❌ WRONG - Don't use arbitrary Tailwind colors
<p className="text-gray-900">...</p>
<p className="text-slate-600">...</p>
```

**Text Color Reference:**
- `text-foreground` - Primary text (headings, body text, labels)
- `text-muted-foreground` - Secondary text (descriptions, captions, placeholders)
- `text-text-inverted` - Text on dark/colored backgrounds (buttons, badges)

#### Background Colors

```tsx
// ✅ CORRECT - Use semantic bg tokens
<div className="bg-bg-primary">...</div>
<div className="bg-bg-secondary">...</div>

// ❌ WRONG - Don't use arbitrary colors
<div className="bg-white">...</div>
<div className="bg-gray-50">...</div>
```

**Background Color Reference:**
- `bg-bg-primary` - Main content backgrounds (cards, modals)
- `bg-bg-secondary` - Secondary surfaces (skeleton loaders, hover states)
- `bg-background` - Page background

#### Border Colors

```tsx
// ✅ CORRECT
<div className="border border-border-strong">...</div>
<div className="border border-border">...</div>

// ❌ WRONG
<div className="border border-gray-200">...</div>
```

**Border Color Reference:**
- `border-border-strong` - Prominent borders (cards, inputs, dividers)
- `border-border` - Subtle borders (table cells, separators)

#### Data Visualization Colors

Use these for charts, status indicators, and data representation:

```tsx
// Success states (green)
<Badge className="bg-data-success text-text-inverted">Approved</Badge>

// Warning states (yellow/amber)
<Badge className="bg-data-warning text-text-inverted">Pending</Badge>

// Error states (red)
<Badge className="bg-data-error text-text-inverted">Rejected</Badge>

// Info states (blue)
<Badge className="bg-data-info text-text-inverted">Info</Badge>
```

**Data Color Reference:**
- `data-success` - Approved, completed, positive states
- `data-warning` - Pending, attention needed, earned leave
- `data-error` - Rejected, errors, critical alerts
- `data-info` - Information, casual leave

#### Interactive Colors

```tsx
// Primary actions
<Button className="bg-card-action text-text-inverted">Submit</Button>

// Role-based colors (use sparingly)
<Badge className="bg-role-admin text-text-inverted">Admin</Badge>
<Badge className="bg-role-manager text-text-inverted">Manager</Badge>
```

**Interactive Color Reference:**
- `card-action` - Primary CTAs, links, focus states
- `role-admin` - Admin-specific UI elements
- `role-manager` - Manager-specific UI elements
- `role-hod` - HOD-specific UI elements

### Dark Mode Support

**All color tokens automatically support dark mode.** The design system uses CSS variables that adapt to the theme:

```tsx
// This automatically works in dark mode - no changes needed
<div className="bg-bg-primary border border-border-strong">
  <h2 className="text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>
```

**Dark Mode Class Pattern:**
```tsx
// ✅ CORRECT - Use dark: prefix when needed for overrides
<div className="bg-bg-primary dark:bg-bg-secondary">...</div>

// ✅ CORRECT - Semantic tokens handle dark mode automatically
<div className="bg-bg-primary">...</div>
```

## Typography

### Font Sizes

Use Tailwind's standard typography scale:

```tsx
// Page titles
<h1 className="text-2xl font-semibold">Dashboard</h1>

// Section headings
<h2 className="text-lg font-semibold">Leave Balance</h2>

// Card titles
<h3 className="text-base font-medium">Details</h3>

// Body text
<p className="text-sm">Regular content</p>

// Small text (captions, meta info)
<p className="text-xs text-muted-foreground">Updated 2 days ago</p>
```

**Typography Scale:**
- `text-2xl` (24px) - Page titles
- `text-xl` (20px) - Major section headings
- `text-lg` (18px) - Card titles, dialog headers
- `text-base` (16px) - Emphasized body text
- `text-sm` (14px) - Default body text
- `text-xs` (12px) - Captions, labels, meta info

### Font Weights

```tsx
font-bold      // 700 - Major headings only
font-semibold  // 600 - Page titles, section headers
font-medium    // 500 - Card titles, labels
font-normal    // 400 - Body text (default)
```

## Spacing System

### Consistent Spacing

Use Tailwind's spacing scale consistently:

```tsx
// Sections on a page
<div className="space-y-6">...</div>

// Cards/components within sections
<div className="space-y-4">...</div>

// Form fields
<div className="space-y-2">...</div>

// Padding inside cards
<div className="p-6">...</div>

// Padding inside compact components
<div className="p-4">...</div>
```

**Spacing Guidelines:**
- `space-y-6` / `gap-6` - Between major page sections
- `space-y-4` / `gap-4` - Between cards or related components
- `space-y-2` / `gap-2` - Between form fields
- `p-6` - Card padding (standard)
- `p-4` - Compact card padding
- `p-2` - Dense layouts (tables, chips)

### Responsive Spacing

```tsx
// Responsive padding
<div className="p-4 md:p-6">...</div>

// Responsive gaps
<div className="grid gap-4 md:gap-6">...</div>
```

## Border Radius

```tsx
// Cards, panels
<Card className="rounded-xl">...</Card>

// Buttons, inputs
<Button className="rounded-lg">...</Button>

// Badges, chips
<Badge className="rounded-full">...</Badge>
```

**Border Radius Scale:**
- `rounded-2xl` (16px) - Large containers, feature cards
- `rounded-xl` (12px) - Standard cards, modals
- `rounded-lg` (8px) - Buttons, inputs, smaller cards
- `rounded-md` (6px) - Small components
- `rounded-full` - Circular elements (badges, avatars)

## Shadows

Use Tailwind's shadow utilities sparingly:

```tsx
// Cards
<Card className="shadow-sm">...</Card>

// Elevated cards (hover states)
<Card className="shadow-lg">...</Card>

// Modals
<Dialog className="shadow-xl">...</Card>
```

**Shadow Guidelines:**
- `shadow-sm` - Default cards
- `shadow-md` - Hover states
- `shadow-lg` - Elevated cards, dropdowns
- `shadow-xl` - Modals, popovers

## Icons

### Icon Library

Use **Lucide React** for all icons:

```tsx
import { Calendar, User, Settings } from "lucide-react";

<Calendar className="size-5" />
```

### Icon Sizing

```tsx
// Standard icons (most common)
<Icon className="size-5" />  // 20px

// Small icons (inline with text)
<Icon className="size-4" />  // 16px

// Large icons (feature displays)
<Icon className="size-6" />  // 24px

// Hero icons (landing pages)
<Icon className="size-12" /> // 48px
```

### Icon Colors

```tsx
// Match parent text color
<Icon className="text-muted-foreground" />

// Status colors
<CheckCircle className="text-data-success" />
<AlertCircle className="text-data-error" />
<Clock className="text-data-warning" />
```

## Component Styling Patterns

### Card Pattern

```tsx
<Card className="solid-card">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Section Header Pattern

```tsx
<section className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
  <h1 className="text-2xl font-semibold text-foreground">Page Title</h1>
  <p className="mt-1 text-sm text-muted-foreground">
    Page description
  </p>
</section>
```

### Form Field Pattern

```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input
    id="field"
    type="text"
    placeholder="Enter value"
    className="transition-all hover:border-card-action/50"
  />
  <p className="text-xs text-muted-foreground">Helper text</p>
</div>
```

## Migration Notes

### Text Color Migration

When updating components, migrate text colors:

```tsx
// OLD (deprecated)
text-text-primary     → text-foreground
text-text-secondary   → text-muted-foreground
text-gray-600         → text-muted-foreground
text-gray-900         → text-foreground

// NEW (correct)
text-foreground
text-muted-foreground
text-text-inverted
```

### Background Color Migration

```tsx
// OLD (deprecated)
bg-white              → bg-bg-primary
bg-gray-50            → bg-bg-secondary
bg-gray-100           → bg-bg-secondary

// NEW (correct)
bg-bg-primary
bg-bg-secondary
bg-background
```

## Common Mistakes to Avoid

1. **Using arbitrary Tailwind colors instead of semantic tokens**
   ```tsx
   // ❌ WRONG
   <p className="text-gray-600">...</p>

   // ✅ CORRECT
   <p className="text-muted-foreground">...</p>
   ```

2. **Not considering dark mode**
   ```tsx
   // ❌ WRONG - Breaks in dark mode
   <div className="bg-white text-black">...</div>

   // ✅ CORRECT - Works in all themes
   <div className="bg-bg-primary text-foreground">...</div>
   ```

3. **Inconsistent spacing**
   ```tsx
   // ❌ WRONG - Mixed spacing scales
   <div className="space-y-3">
     <div className="mb-5">...</div>
   </div>

   // ✅ CORRECT - Consistent spacing
   <div className="space-y-4">
     <div>...</div>
   </div>
   ```

4. **Hardcoded colors in styles**
   ```tsx
   // ❌ WRONG
   <div style={{ color: '#666666' }}>...</div>

   // ✅ CORRECT
   <div className="text-muted-foreground">...</div>
   ```

## Quick Reference

### Most Common Classes

```tsx
// Text
text-foreground text-muted-foreground text-text-inverted

// Backgrounds
bg-bg-primary bg-bg-secondary bg-background

// Borders
border-border-strong border-border

// Status Colors
data-success data-warning data-error data-info

// Interactive
card-action role-admin role-manager

// Spacing
space-y-6 space-y-4 space-y-2 p-6 p-4 gap-4 gap-6

// Border Radius
rounded-xl rounded-lg rounded-full

// Shadows
shadow-sm shadow-lg
```
