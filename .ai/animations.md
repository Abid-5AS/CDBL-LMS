# Animation Guidelines

This document outlines animation patterns and best practices for the CDBL LMS application using Framer Motion.

## Animation Library

**Use Framer Motion** for all animations:

```tsx
import { motion, AnimatePresence } from "framer-motion";
```

## Animation Durations

Use standardized durations from `lib/animations.ts`:

```tsx
import { ANIMATION_DURATIONS } from "@/lib/animations";

// Fast animations (hover, focus, ripple)
duration: ANIMATION_DURATIONS.fast  // 0.15s

// Normal animations (cards, modals, transitions)
duration: ANIMATION_DURATIONS.normal  // 0.35s

// Slow animations (page transitions, major changes)
duration: ANIMATION_DURATIONS.slow  // 0.5s
```

**Duration Guidelines:**
- **0.15s (fast)** - Micro-interactions: hover effects, focus states, button presses
- **0.35s (normal)** - Standard transitions: modals, dropdowns, tooltips, cards
- **0.5s (slow)** - Major changes: page transitions, route changes, large layout shifts

## Common Animation Patterns

### Fade In

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.35 }}
>
  {/* Content */}
</motion.div>
```

### Slide In from Bottom

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
>
  {/* Content */}
</motion.div>
```

### Slide In from Side

```tsx
// From left
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.35 }}
>
  {/* Content */}
</motion.div>

// From right
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.35 }}
>
  {/* Content */}
</motion.div>
```

### Scale Animation

```tsx
<motion.div
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.35, type: "spring", stiffness: 200 }}
>
  {/* Content */}
</motion.div>
```

### Staggered Animations

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

<motion.div variants={container} initial="hidden" animate="show">
  <motion.div variants={item}>Item 1</motion.div>
  <motion.div variants={item}>Item 2</motion.div>
  <motion.div variants={item}>Item 3</motion.div>
</motion.div>
```

### Sequential Delays

```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1 }}
/>

<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
/>

<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.3 }}
/>
```

## Interactive Animations

### Hover Effects

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15 }}
>
  Button
</motion.button>
```

### Scale on Hover (Subtle)

```tsx
<motion.div
  className="card"
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.15 }}
>
  {/* Card content */}
</motion.div>
```

### Icon Animations

```tsx
<motion.div
  whileHover={{ scale: 1.1, rotate: 5 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15 }}
>
  <Icon className="size-5" />
</motion.div>
```

## Page Transitions

### Enter Animation

```tsx
<motion.div
  className="page-container"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  {/* Page content */}
</motion.div>
```

### Modal/Dialog Animation

```tsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* Modal */}
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Modal content */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Dropdown Animation

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      className="dropdown"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Dropdown items */}
    </motion.div>
  )}
</AnimatePresence>
```

## Loading States

### Spinning Loader

```tsx
import { Loader2 } from "lucide-react";

<Loader2 className="size-5 animate-spin" />
```

### Pulsing Indicator

```tsx
<div className="size-2 rounded-full bg-data-success animate-pulse" />
```

### Shimmer Effect

```tsx
<motion.div
  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
  initial={{ x: "-100%" }}
  animate={{ x: "100%" }}
  transition={{
    repeat: Infinity,
    duration: 3,
    ease: "linear",
  }}
/>
```

### Skeleton Loader

Use Tailwind's `animate-pulse` utility:

```tsx
<div className="space-y-4">
  <div className="h-4 bg-bg-secondary rounded animate-pulse" />
  <div className="h-4 bg-bg-secondary rounded animate-pulse w-3/4" />
  <div className="h-4 bg-bg-secondary rounded animate-pulse w-1/2" />
</div>
```

## Error & Success Animations

### Shake Animation (Error)

```tsx
// Add shake on error
const form = e.currentTarget;
form.classList.add("animate-shake-x", "animate-duration-500ms");
setTimeout(() => {
  form.classList.remove("animate-shake-x", "animate-duration-500ms");
}, 500);
```

### Success Checkmark

```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 200, damping: 15 }}
>
  <CheckCircle className="size-12 text-data-success" />
</motion.div>
```

## Background Animations

### Floating Gradient Orbs

```tsx
<motion.div
  className="absolute -top-1/2 -right-1/2 size-96 bg-gradient-to-br from-card-action/20 to-data-info/20 rounded-full blur-3xl"
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.5, 0.3],
  }}
  transition={{
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut",
  }}
/>
```

### Breathing Animation

```tsx
<motion.div
  animate={{
    scale: [1, 1.05, 1],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  }}
>
  {/* Content */}
</motion.div>
```

### Floating Animation

```tsx
<motion.div
  animate={{
    y: [0, -15, 0],
  }}
  transition={{
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut",
  }}
>
  {/* Content */}
</motion.div>
```

## Spring Animations

For natural, bouncy effects:

```tsx
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{
    type: "spring",
    stiffness: 200,
    damping: 15,
    delay: 0.1,
  }}
>
  {/* Content */}
</motion.div>
```

**Spring Parameters:**
- `stiffness: 200` - Medium bounce (default)
- `stiffness: 300` - More bouncy
- `stiffness: 100` - Softer bounce
- `damping: 15` - Medium resistance (default)
- `damping: 10` - More oscillation
- `damping: 20` - Less oscillation

## List Animations

### Enter/Exit Animations

```tsx
<AnimatePresence>
  {items.map((item) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Item content */}
    </motion.div>
  ))}
</AnimatePresence>
```

### Layout Animation

```tsx
<motion.div
  layout
  transition={{ duration: 0.3, type: "spring" }}
>
  {/* Content that might change size */}
</motion.div>
```

## Tailwind CSS Animations

For simple animations, use Tailwind utilities:

```tsx
// Fade in on mount
<div className="animate-fade-in">...</div>

// Fade in from bottom
<div className="animate-fade-in-up">...</div>

// Spin (loading)
<div className="animate-spin">...</div>

// Pulse (notifications)
<div className="animate-pulse">...</div>

// Custom durations
<div className="animate-fade-in animate-duration-500ms">...</div>
<div className="animate-fade-in animate-duration-700ms">...</div>
```

## Animation Best Practices

### 1. Use AnimatePresence for Exit Animations

```tsx
// ✅ CORRECT
<AnimatePresence>
  {isVisible && (
    <motion.div exit={{ opacity: 0 }}>
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>

// ❌ WRONG - Exit animation won't work
{isVisible && (
  <motion.div exit={{ opacity: 0 }}>
    {/* Content */}
  </motion.div>
)}
```

### 2. Don't Over-Animate

```tsx
// ❌ TOO MUCH - Everything moves
<motion.div animate={{ x: [0, 100, 0], y: [0, 50, 0], rotate: [0, 360, 0] }}>
  {/* Content */}
</motion.div>

// ✅ SUBTLE - Just enough
<motion.div whileHover={{ scale: 1.02 }}>
  {/* Content */}
</motion.div>
```

### 3. Match Animation to Purpose

```tsx
// Fast for micro-interactions
<motion.button whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }}>

// Normal for standard transitions
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

// Slow for major changes
<motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
```

### 4. Consider Performance

```tsx
// ✅ GOOD - GPU-accelerated properties
animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}

// ❌ BAD - CPU-heavy properties
animate={{ width: "100%", height: "auto", padding: "1rem" }}
```

### 5. Provide Immediate Feedback

```tsx
// ✅ CORRECT - Immediate feedback on interaction
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.1 }}
>
  Click Me
</motion.button>

// ❌ WRONG - Delayed feedback feels unresponsive
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.5 }}
>
  Click Me
</motion.button>
```

### 6. Stagger Children for Lists

```tsx
// ✅ CORRECT - Smooth staggered entrance
<motion.div
  initial="hidden"
  animate="show"
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item.name}
    </motion.div>
  ))}
</motion.div>

// ❌ WRONG - All animate at once
{items.map((item) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {item.name}
  </motion.div>
))}
```

## Accessibility

### Respect Reduced Motion

```tsx
import { useReducedMotion } from "framer-motion";

const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
>
  {/* Content */}
</motion.div>
```

## Common Animation Recipes

### Card Entrance

```tsx
<motion.div
  className="card"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35 }}
  whileHover={{ scale: 1.02 }}
>
  {/* Card content */}
</motion.div>
```

### Button with Loading

```tsx
<Button disabled={loading}>
  {loading && <Loader2 className="size-5 animate-spin" />}
  {loading ? "Loading..." : "Submit"}
</Button>
```

### Notification Toast

```tsx
<motion.div
  className="toast"
  initial={{ opacity: 0, y: -50, scale: 0.9 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -20, scale: 0.9 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  {/* Toast content */}
</motion.div>
```

### Page Header

```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <h1 className="text-2xl font-semibold">Page Title</h1>
  <p className="text-muted-foreground">Description</p>
</motion.div>
```

## Quick Reference

### Duration Presets
```tsx
0.15s - Hover, focus, tap feedback
0.35s - Modal, dropdown, tooltip, card
0.5s  - Page transition, major layout change
```

### Easing Functions
```tsx
ease: "easeOut"   // Deceleration (most common)
ease: "easeIn"    // Acceleration (rare)
ease: "easeInOut" // Smooth start and end
ease: "linear"    // Constant speed (loaders)
```

### Common Values
```tsx
// Hover scale
scale: 1.02      // Subtle (cards)
scale: 1.05      // Noticeable (buttons)

// Tap scale
scale: 0.95      // Standard press feedback

// Slide distance
x: 20 / y: 20    // Subtle slide
x: 50 / y: 50    // Prominent slide
```
