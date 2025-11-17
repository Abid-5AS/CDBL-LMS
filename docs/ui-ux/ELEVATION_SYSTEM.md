# Elevation System Guide

## Overview

The application now uses a simple elevation scale for consistent visual hierarchy. **The page background is white** (or dark gray in dark mode), and all content sits on cards/panels with borders and shadows.

## Surface Tokens

### Light Mode

```css
--surface-canvas: #ffffff; /* Page background */
--surface-subtle: #f8fafc; /* Section headers / strips */
--surface-1: #ffffff; /* Cards / panels */
--surface-2: #fcfcfd; /* Nested cards */
```

### Dark Mode

```css
--surface-canvas: #0b1220; /* Page background */
--surface-subtle: #111827; /* Section headers / strips */
--surface-1: #0f172a; /* Cards / panels */
--surface-2: #111827; /* Nested cards */
```

## Border Tokens

```css
--border-soft: #e5e7eb; /* gray-200 - default borders */
--border-strong: #cbd5e1; /* slate-300 - emphasis borders */
```

## Shadow Tokens

```css
--shadow-1: 0 1px 2px rgba(15, 23, 42, 0.06); /* Subtle elevation */
--shadow-2: 0 2px 6px rgba(15, 23, 42, 0.08), 0 1px 1px rgba(15, 23, 42, 0.04); /* Card elevation */
```

## Border Radius

```css
--radius-md: 14px; /* Inner cards */
--radius-lg: 18px; /* Panels/sections */
```

## Utility Classes

### `.app-panel`

The main container wrapper for dashboard content.

```tsx
<div className="app-panel p-6 md:p-8">{/* Dashboard content */}</div>
```

**Styles:**

- Background: `var(--surface-1)`
- Border: `1px solid var(--border-soft)`
- Border radius: `var(--radius-lg)` (18px)
- Shadow: `var(--shadow-2)`

### `.section`

Dashboard blocks / major sections.

```tsx
<section className="section overflow-hidden">
  <div className="section-header px-5 py-3">
    <h2>Action Center</h2>
  </div>
  <div className="p-5">{/* Section content */}</div>
</section>
```

**Styles:**

- Background: `var(--surface-1)`
- Border: `1px solid var(--border-soft)`
- Border radius: `var(--radius-lg)` (18px)
- Shadow: `var(--shadow-1)`

### `.section-header`

Header strip at the top of sections.

```tsx
<div className="section-header px-5 py-3 flex items-center justify-between">
  <h2 className="text-sm font-medium text-text-secondary">Action Center</h2>
  <div className="text-xs text-text-tertiary">4</div>
</div>
```

**Styles:**

- Background: `var(--surface-subtle)` - Creates visual separation
- Border bottom: `1px solid var(--border-soft)`
- Rounded top corners

### `.card`

KPI tiles, inner cards, smaller components.

```tsx
<div className="card p-4">{/* Card content */}</div>
```

**Styles:**

- Background: `var(--surface-2)`
- Border: `1px solid var(--border-soft)`
- Border radius: `var(--radius-md)` (14px)
- Shadow: `var(--shadow-1)`

### `.table`

Table containers with styled headers.

```tsx
<div className="table overflow-hidden">
  <table>
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Styles:**

- Background: `var(--surface-1)`
- Border: `1px solid var(--border-soft)`
- Border radius: `var(--radius-md)`
- Header row: `var(--surface-subtle)` background
- Hover: Brand color mix at 35% opacity

## Usage Examples

### Dashboard Layout

```tsx
export default function EmployeeDashboard() {
  return (
    <div className="app-panel p-6 md:p-8 max-w-7xl mx-auto">
      {/* Action Center Section */}
      <section className="section overflow-hidden mb-6">
        <div className="section-header px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">
            Action Center
          </h2>
          <span className="text-xs text-text-tertiary">4 items</span>
        </div>

        <div className="p-5">
          <div className="table overflow-hidden">
            <table className="w-full">{/* Table content */}</table>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Earned Leave
          </h3>
          <p className="text-2xl font-semibold text-text-primary">12 days</p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Casual Leave
          </h3>
          <p className="text-2xl font-semibold text-text-primary">8 days</p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Medical Leave
          </h3>
          <p className="text-2xl font-semibold text-text-primary">5 days</p>
        </div>
      </div>
    </div>
  );
}
```

### Form in Panel

```tsx
<div className="app-panel p-6 md:p-8 max-w-2xl mx-auto">
  <section className="section overflow-hidden">
    <div className="section-header px-5 py-3">
      <h2 className="text-base font-semibold text-text-primary">
        Apply for Leave
      </h2>
    </div>

    <div className="p-6">
      <form>{/* Form fields */}</form>
    </div>
  </section>
</div>
```

### Nested Cards

```tsx
<div className="section overflow-hidden">
  <div className="section-header px-5 py-3">
    <h2>Leave Overview</h2>
  </div>

  <div className="p-5 space-y-4">
    {/* Use .card for nested items */}
    <div className="card p-4">
      <p>Earned Leave: 12 days</p>
    </div>

    <div className="card p-4">
      <p>Casual Leave: 8 days</p>
    </div>
  </div>
</div>
```

## Visual Rules

1. **Canvas = white** - Everything sits on the white (or dark) canvas
2. **Cards have borders and shadows** - Creates clear separation
3. **Section headers use subtle background** - `var(--surface-subtle)` for immediate visual hierarchy
4. **Tables**: Header row uses `--surface-subtle`, body uses `--surface-1`, hover adds brand color
5. **KPI tiles**: Keep colored accents **inside**; tile background stays neutral (`--surface-2`)

## Migration Tips

### Old Pattern

```tsx
<div className="bg-bg-primary rounded-lg">{/* Content without borders */}</div>
```

### New Pattern

```tsx
<div className="card p-4">{/* Content with proper elevation */}</div>
```

### Old Dashboard Container

```tsx
<div className="p-6 bg-bg-secondary">{/* Content */}</div>
```

### New Dashboard Container

```tsx
<div className="app-panel p-6 md:p-8">
  {/* Content with proper elevation */}
</div>
```

## Tailwind Utilities

You can also use the surface tokens directly in Tailwind:

```tsx
<div className="bg-[var(--surface-1)] border border-[var(--border-soft)] rounded-[var(--radius-lg)] shadow-[var(--shadow-2)]">
  {/* Custom component */}
</div>
```

But prefer the utility classes (`.card`, `.section`, `.app-panel`) for consistency.

## Dark Mode

All surface tokens automatically adapt to dark mode through the `.dark` class:

```css
.dark {
  --surface-canvas: #0b1220;
  --surface-subtle: #111827;
  --surface-1: #0f172a;
  --surface-2: #111827;
  --border-soft: #243244;
  --border-strong: #314156;
  /* Shadows are darker in dark mode */
}
```

No additional dark mode classes needed - just use the utility classes!
