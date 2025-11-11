# CDBL LMS UI/UX Style Guide

**Version:** 1.0
**Last Updated:** 2025-11-11
**Purpose:** Comprehensive guide for maintaining consistent UI/UX across the CDBL Leave Management System

---

## 🎨 Design System Overview

### Technology Stack
- **Framework:** Next.js 16.0.0 with React 19.2.0
- **Styling:** Tailwind CSS 4 (latest)
- **Components:** shadcn/ui (v3.5.0) + Radix UI primitives
- **Animations:** Framer Motion (v12.23.24)
- **State:** Zustand (v5.0.8)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React (v0.546.0)
- **Theme:** next-themes (v0.4.6) for dark mode

---

## 🎯 Core Principles

1. **Consistency First** - Always use existing components before creating new ones
2. **Accessibility** - All components must be keyboard navigable and screen-reader friendly
3. **Performance** - Optimize for speed with proper caching and lazy loading
4. **Responsive** - Mobile-first approach, test on all breakpoints
5. **Theme-Aware** - All components must work in both light and dark modes

---

## 🎨 Color System

### Usage Guidelines

**✅ ALWAYS USE:**
```tsx
// CSS Variables (Preferred)
className="bg-card text-foreground"
className="border-border text-muted-foreground"

// Semantic colors from globals.css
var(--color-bg)
var(--color-card)
var(--color-text)
var(--color-primary)
var(--color-success)
var(--color-warning)
var(--color-danger)
```

**❌ AVOID:**
```tsx
// Hardcoded Tailwind colors
className="bg-white text-slate-700"      // ❌ Bad
className="bg-gray-100 text-gray-900"    // ❌ Bad
className="bg-neutral-50"                // ❌ Bad
```

### Color Palette

#### Light Mode
- **Background:** `#f6f6fa` (`var(--color-bg)`)
- **Card:** `#ffffff` (`var(--color-card)`)
- **Text:** `#0f172a` (`var(--color-text)`)
- **Text Secondary:** `#475569` (`var(--color-text-secondary)`)
- **Primary:** `#6366f1` (`var(--color-primary)`)
- **Success:** `#10b981` (`var(--color-success)`)
- **Warning:** `#fbbf24` (`var(--color-warning)`)
- **Danger:** `#ef4444` (`var(--color-danger)`)
- **Border:** `#e2e8f0` (`var(--color-border)`)

#### Dark Mode
- **Background:** `#0f172a` (`var(--color-bg)`)
- **Card:** `#1e293b` (`var(--color-card)`)
- **Text:** `#f8fafc` (`var(--color-text)`)
- **Text Secondary:** `#94a3b8` (`var(--color-text-secondary)`)
- **Border:** `#334155` (`var(--color-border)`)
- *(Brand colors remain consistent)*

---

## 🧩 Component Library

### Button Component

**Location:** `/components/ui/button.tsx`

#### Standard Variants
```tsx
import { Button } from "@/components/ui/button"

// Primary action
<Button variant="default">Submit</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Outlined button
<Button variant="outline">Cancel</Button>

// Secondary action
<Button variant="secondary">Save Draft</Button>

// Subtle action
<Button variant="ghost">Skip</Button>

// Text link
<Button variant="link">Learn More</Button>
```

#### Glass Variants (for glassmorphism UI)
```tsx
// Glass effect button
<Button variant="glass">Action</Button>

// Active glass state
<Button variant="glass-active">Active</Button>

// Ghost glass effect
<Button variant="glass-ghost">Subtle</Button>
```

#### Sizes
```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
<Button size="icon-sm"><Icon /></Button>
<Button size="icon-lg"><Icon /></Button>
```

### Card Component

**Location:** `/components/ui/card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Footer actions */}
  </CardFooter>
</Card>
```

**Features:**
- Built-in backdrop blur (`backdrop-blur-sm`)
- Automatic light/dark mode support
- Semi-transparent background (`bg-card/80`)
- Proper border and shadow system

### Glass Modal Component

**Location:** `/components/ui/glass-modal.tsx`

```tsx
import {
  GlassModal,
  GlassModalTrigger,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalFooter,
} from "@/components/ui/glass-modal"

<GlassModal>
  <GlassModalTrigger asChild>
    <Button>Open Modal</Button>
  </GlassModalTrigger>
  <GlassModalContent>
    <GlassModalHeader>
      <GlassModalTitle>Modal Title</GlassModalTitle>
      <GlassModalDescription>Modal description</GlassModalDescription>
    </GlassModalHeader>
    {/* Content */}
    <GlassModalFooter>
      {/* Actions */}
    </GlassModalFooter>
  </GlassModalContent>
</GlassModal>
```

---

## ✨ Glassmorphism System

### CSS Classes Available

**Location:** `/app/globals.css`

```tsx
// Light glass effect (subtle)
className="glass-light"

// Base glass effect (balanced)
className="glass-base"

// Medium glass effect (moderate)
className="glass-medium"

// Strong glass effect (prominent)
className="glass-strong"

// Navigation glass effect
className="glass-nav"

// Modal glass effect
className="glass-modal"

// Top navigation glass
className="top-glass-nav"

// Utility glass card
className="glass-card"
```

### When to Use Glass Effects

**✅ Good Use Cases:**
- Navigation bars (fixed/sticky headers)
- Modal overlays and dialogs
- Floating action buttons
- Overlay panels and drawers
- Dashboard widgets with background content

**❌ Avoid Glass Effects:**
- Form inputs (use standard inputs instead)
- Dense data tables (reduces readability)
- Text-heavy content areas
- Print views or PDFs

### Glass Text Colors
```tsx
// For text on glass surfaces
className="glass-nav-text"
className="glass-nav-text-hover"  // On hover state
```

---

## 📐 Spacing System

### Consistent Spacing Scale

**Use Tailwind's spacing scale consistently:**

```tsx
// Padding (use p-* utilities)
p-2   // 0.5rem (8px)   - Tight
p-4   // 1rem (16px)    - Default
p-6   // 1.5rem (24px)  - Comfortable
p-8   // 2rem (32px)    - Spacious

// Gap (use gap-* utilities)
gap-2  // Component internal spacing
gap-4  // Default gap between elements
gap-6  // Section spacing
gap-8  // Major section dividers

// Margin (use sparingly, prefer gap)
mb-4   // Small vertical margin
mb-6   // Medium vertical margin
mb-8   // Large vertical margin
```

### Layout Patterns

```tsx
// Card with consistent padding
<Card className="p-6">
  <div className="space-y-4">  {/* Vertical spacing */}
    <div className="flex gap-4"> {/* Horizontal spacing */}
      {/* Content */}
    </div>
  </div>
</Card>

// Section dividers
<div className="space-y-8">  {/* Major sections */}
  <section className="space-y-4"> {/* Within section */}
    {/* Content */}
  </section>
</div>
```

---

## 🎭 Animation Guidelines

### Framer Motion Best Practices

```tsx
import { motion } from "framer-motion"

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>

// Slide up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 100, damping: 20 }}
>
  {content}
</motion.div>

// Scale on hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

### Animation Performance

**✅ Prefer animating:**
- `opacity`
- `transform` (translate, scale, rotate)

**❌ Avoid animating:**
- `width` / `height`
- `padding` / `margin`
- `background-color` (use `opacity` instead)

---

## 📱 Responsive Design

### Breakpoints

```tsx
// Tailwind breakpoints
sm:   // 640px
md:   // 768px
lg:   // 1024px
xl:   // 1280px
2xl:  // 1536px
```

### Mobile-First Approach

```tsx
// Start with mobile, scale up
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">
  {/* Mobile: column, Desktop: row */}
</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

---

## 🔧 Form Components

### Best Practices

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Define schema
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
})

// In component
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    email: "",
    name: "",
  },
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

---

## 🎨 Icon System

### Lucide React Icons

**Location:** Import from `lucide-react`

```tsx
import { User, Settings, LogOut, ChevronDown } from "lucide-react"

// Standard size (16px)
<User className="h-4 w-4" />

// Medium size (20px)
<Settings className="h-5 w-5" />

// Large size (24px)
<LogOut className="h-6 w-6" />

// Use with Button
<Button>
  <User className="mr-2 h-4 w-4" />
  Profile
</Button>
```

### Icon Guidelines

- Always specify both `h-*` and `w-*` (or use `size-*` utility in Tailwind v4)
- Use consistent sizes throughout the app
- Add `aria-label` for icon-only buttons
- Consider `aria-hidden="true"` for decorative icons

---

## 🌙 Dark Mode

### Theme Management

```tsx
"use client"
import { useTheme } from "next-themes"

export function ThemeAwareComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  )
}
```

### CSS for Dark Mode

```css
/* In globals.css or component CSS */
.my-component {
  background-color: var(--color-card);
  color: var(--color-text);
}

/* Tailwind dark: modifier */
.dark .my-component {
  /* Override if needed */
}
```

```tsx
// In JSX with Tailwind
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  Content
</div>

// Better: Use CSS variables
<div className="bg-card text-foreground">
  Content
</div>
```

---

## 📊 Data Display

### Tables

**Location:** `/components/ui/table.tsx`

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
      <TableCell>
        <Button variant="ghost" size="sm">Edit</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 🚨 Known Issues & Future Improvements

### Color Standardization (Priority: High)

**Issue:** 326 instances of hardcoded color classes (`text-slate-*`, `bg-gray-*`, etc.) across 84 files.

**Plan:**
1. Create utility function for common color patterns
2. Batch replace common patterns:
   - `text-slate-700` → `text-foreground`
   - `text-slate-500` → `text-muted-foreground`
   - `bg-white` → `bg-card`
   - `bg-slate-50` → `bg-background`
3. Update component library documentation
4. Add ESLint rule to prevent new hardcoded colors

**Files Most Affected:**
- `/app/leaves/apply/_components/apply-leave-form.tsx` (22 instances)
- `/app/leaves/apply/_components/leave-confirmation-modal.tsx` (17 instances)
- `/components/dashboard/LeaveUtilizationCard.tsx` (17 instances)
- `/components/unified/SlideDrawer.tsx` (13 instances)
- `/app/employees/components/LeaveHistoryTable.tsx` (12 instances)

---

## ✅ Component Usage Checklist

Before creating a new component, ask:

- [ ] Does a similar component already exist?
- [ ] Can I extend an existing component with props?
- [ ] Does it support both light and dark modes?
- [ ] Is it keyboard accessible?
- [ ] Does it use CSS variables for colors?
- [ ] Is it responsive (mobile-first)?
- [ ] Are animations performant (transform/opacity only)?
- [ ] Is it documented in this style guide?

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

---

## 📚 Resources

### Official Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI Docs](https://www.radix-ui.com)
- [Framer Motion Docs](https://www.framer.com/motion)

### Internal Files
- `/app/globals.css` - Global styles and CSS variables
- `/components/ui/` - Base UI component library
- `/lib/utils.ts` - Utility functions (`cn()` for class merging)
- `/components.json` - shadcn/ui configuration

---

## 🤝 Contributing Guidelines

### Adding New Components

1. Check if shadcn/ui has a component: `npx shadcn@latest add <component-name>`
2. If custom component needed:
   - Create in `/components/ui/` for reusable UI
   - Create in `/components/<feature>/` for feature-specific
3. Use TypeScript with proper prop types
4. Support both light and dark modes
5. Add to this style guide

### Code Review Checklist

- [ ] Uses CSS variables for colors
- [ ] Responsive on all breakpoints
- [ ] Accessible (ARIA labels, keyboard nav)
- [ ] Type-safe (no `any` types)
- [ ] Dark mode tested
- [ ] Performance optimized

---

**For questions or suggestions, contact the development team.**
