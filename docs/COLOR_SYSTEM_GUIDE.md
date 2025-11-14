# Color System Guide

## Overview

The CDBL-LMS color system provides a comprehensive, accessible, and themeable approach to colors across the application. It's built on semantic color naming, WCAG compliance, and supports both light and dark modes.

## Quick Start

### Import Color Constants

```typescript
import { SEMANTIC_COLORS, FUNCTIONAL_COLORS } from "@/constants/colors";
import { ROLE_COLORS } from "@/constants/colors";
import { STATUS_COLORS } from "@/constants/colors";
```

### Use Color Hooks

```typescript
import { useRoleColors, useStatusColor, useDarkMode } from "@/hooks";

function MyComponent() {
  const { isDark } = useDarkMode();
  const { accent } = useRoleColors({ role: 'EMPLOYEE' });
  const { color } = useStatusColor({ status: 'success' });

  return <div style={{ color: accent }}>Colored text</div>;
}
```

### Use Color Utilities

```typescript
import { getContrastRatio, meetsWCAGAA } from "@/lib/colors";
import { hexToRgb, hslToHex } from "@/lib/colors";

// Check accessibility
const ratio = getContrastRatio('#ffffff', '#000000'); // 21
const isAccessible = meetsWCAGAA('#ffffff', '#000000'); // true

// Convert colors
const rgb = hexToRgb('#ff0000'); // { r: 255, g: 0, b: 0 }
const hex = hslToHex(0, 100, 50); // "#ff0000"
```

## Color Architecture

### Semantic Colors (CSS Variables)

Semantic colors are defined using CSS custom properties and don't change between light/dark modes. The CSS variables are what change.

```typescript
const SEMANTIC_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
  // ... 10 more colors
};
```

Used in components:
```typescript
<button style={{ backgroundColor: SEMANTIC_COLORS.primary }}>
  Click me
</button>
```

### Functional Colors (Hardcoded Values)

Functional colors are direct hex values for specific use cases:

```typescript
const FUNCTIONAL_COLORS = {
  success: {
    light: "#10b981",    // Light mode color
    dark: "#34d399",     // Dark mode color
    bg: "rgba(...)",     // Background tint
  },
  // ... error, warning, info, pending
};
```

Used in components:
```typescript
<span style={{ color: isDark ? FUNCTIONAL_COLORS.success.dark : FUNCTIONAL_COLORS.success.light }}>
  Success message
</span>
```

### Role-Based Colors

7 distinct color schemes for each user role:

```typescript
const ROLE_COLORS = {
  EMPLOYEE: { accent: "#6366f1", ... },     // Indigo
  MANAGER: { accent: "#059669", ... },      // Emerald
  DEPT_HEAD: { accent: "#dc2626", ... },    // Red
  HR_ADMIN: { accent: "#7c3aed", ... },     // Violet
  HR_HEAD: { accent: "#ea580c", ... },      // Orange
  CEO: { accent: "#1f2937", ... },          // Gray
  SYSTEM_ADMIN: { accent: "#0891b2", ... }, // Cyan
};
```

Used with RoleBasedDashboard:
```typescript
const colors = useRoleColors({ role: currentUser.role });
// { accent: "#6366f1", accentSoft: "#eef2ff", gradient: {...} }
```

### Status Colors

6 semantic status types with full color schemes:

```typescript
const STATUS_COLORS = {
  success: { /* green */ },
  error: { /* red */ },
  warning: { /* amber */ },
  info: { /* blue */ },
  pending: { /* violet */ },
  neutral: { /* gray */ },
};
```

## Color Categories

### Primary Colors
- **Primary** - Main action color, primary buttons, links
- **Secondary** - Supporting actions, secondary UI
- **Accent** - Highlights, important elements

### Functional Colors
- **Success** - Positive actions, approved state (#10b981)
- **Error** - Destructive actions, errors (#ef4444)
- **Warning** - Cautions, alerts (#f59e0b)
- **Info** - Informational content (#3b82f6)
- **Pending** - In progress, awaiting action (#8b5cf6)

### Neutral Colors
- **Text** - Foreground/primary text
- **Muted** - Secondary text, disabled state
- **Background** - Page and surface backgrounds
- **Border** - Dividers, borders
- **Card** - Card backgrounds

## Leave Status Colors

Specific colors for leave request states:

```typescript
const LEAVE_STATUS_COLORS = {
  APPROVED: { light: "#10b981", ... },    // Green
  REJECTED: { light: "#ef4444", ... },    // Red
  PENDING: { light: "#f59e0b", ... },     // Amber
  RETURNED: { light: "#3b82f6", ... },    // Blue
  ON_LEAVE: { light: "#8b5cf6", ... },    // Violet
  CANCELLED: { light: "#6b7280", ... },   // Gray
};
```

## Usage Patterns

### Pattern 1: Role-Based Dashboard

```typescript
function Dashboard() {
  const { accent, gradient } = useRoleColors({
    role: user.role,
    isDark: isDarkMode
  });

  return (
    <div style={{
      background: `linear-gradient(to-br, ${gradient.from}, ${gradient.to})`
    }}>
      <h1 style={{ color: accent }}>Dashboard</h1>
    </div>
  );
}
```

### Pattern 2: Status Indicator Badge

```typescript
function StatusBadge({ status }) {
  const { color, bgColor } = useStatusColor({
    status,
    isLeaveStatus: true,
    isDark: isDarkMode
  });

  return (
    <span style={{ color, backgroundColor: bgColor }}>
      {status}
    </span>
  );
}
```

### Pattern 3: Accessible Buttons

```typescript
function Button({ variant = 'primary' }) {
  const { isDark } = useDarkMode();

  const colors = {
    primary: {
      bg: SEMANTIC_COLORS.primary,
      text: '#ffffff',
    },
    secondary: {
      bg: SEMANTIC_COLORS.secondary,
      text: '#ffffff',
    },
  };

  const color = colors[variant];

  return (
    <button style={{
      backgroundColor: color.bg,
      color: color.text,
    }}>
      Click me
    </button>
  );
}
```

### Pattern 4: Dark Mode Responsive

```typescript
function Card() {
  const { isDark } = useDarkMode();
  const bgColor = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';

  return (
    <div style={{
      backgroundColor: bgColor,
      color: textColor,
      padding: '1rem',
      borderRadius: '0.5rem',
    }}>
      Card content
    </div>
  );
}
```

## Accessibility

### WCAG Compliance

All colors are tested for WCAG AA compliance:

```typescript
import { meetsWCAGAA, getContrastRatio } from "@/lib/colors";

// Check contrast ratio
const ratio = getContrastRatio('#ffffff', '#666666'); // 4.48:1

// Validate against standard
const accessible = meetsWCAGAA('#ffffff', '#666666'); // true
const veryAccessible = meetsWCAGAAA('#ffffff', '#666666'); // false (7:1 required)
```

### Text Color Selection

Get contrasting text color automatically:

```typescript
import { getContrastingTextColor } from "@/lib/colors";

const bgColor = '#3b82f6';
const textColor = getContrastingTextColor(bgColor); // '#ffffff'
```

### Contrast Validation

Generate detailed contrast reports:

```typescript
import { getContrastReport } from "@/lib/colors";

const report = getContrastReport('#ffffff', '#000000', 'text');
console.log(report);
// {
//   color1: '#ffffff',
//   color2: '#000000',
//   ratio: '21:1',
//   wcagAA: true,
//   wcagAAA: true,
//   wcagLevel: 'AAA',
//   passes: true,
//   message: '✓ Meets AAA'
// }
```

## Dark Mode

### System Detection

The color system automatically detects system dark mode preference:

```typescript
function MyComponent() {
  const { isDark, systemDark } = useDarkMode();

  return (
    <div>
      {isDark && <span>Dark mode active</span>}
      {systemDark && <span>System prefers dark</span>}
    </div>
  );
}
```

### Light Mode Override

Use light colors explicitly:

```typescript
const color = getStatusColor('success', false); // Light mode color
const darkColor = getStatusColor('success', true); // Dark mode color
```

## Color Conversion

Convert between color formats:

```typescript
import { hexToRgb, rgbToHsl, hslToHex } from "@/lib/colors";

// Hex to RGB
const rgb = hexToRgb('#ff0000'); // { r: 255, g: 0, b: 0 }

// RGB to HSL
const hsl = rgbToHsl(255, 0, 0); // { h: 0, s: 100, l: 50 }

// HSL to Hex
const hex = hslToHex(0, 100, 50); // "#FF0000"

// Format as CSS
const css = formatRgb(255, 0, 0, 0.5); // "rgba(255, 0, 0, 0.5)"
```

## Best Practices

1. **Use Semantic Names** - Always use semantic color names, not hardcoded values
2. **Role Awareness** - Use role colors for role-specific UI
3. **Status Indication** - Use status colors for state indication
4. **Dark Mode Support** - Always consider dark mode variants
5. **Contrast Check** - Validate contrast for important UI elements
6. **CSS Variables** - Prefer CSS variables for theme switching
7. **Memoization** - Color hooks are memoized, use them freely

## Examples

### Complete Form Component

```typescript
"use client";

import { useStatusColor, useDarkMode } from "@/hooks";
import { meetsWCAGAA, getContrastingTextColor } from "@/lib/colors";
import { SEMANTIC_COLORS } from "@/constants/colors";

function Form() {
  const { isDark } = useDarkMode();
  const { color: errorColor, bgColor: errorBg } = useStatusColor({
    status: 'error',
    isDark
  });

  return (
    <form>
      <input
        style={{
          borderColor: SEMANTIC_COLORS.border,
          padding: '0.5rem',
          borderRadius: '0.25rem',
        }}
        placeholder="Enter text"
      />
      <button
        style={{
          backgroundColor: SEMANTIC_COLORS.primary,
          color: getContrastingTextColor(SEMANTIC_COLORS.primary),
        }}
      >
        Submit
      </button>
      <div style={{
        backgroundColor: errorBg,
        color: errorColor,
        padding: '0.5rem',
        borderRadius: '0.25rem',
      }}>
        Error message
      </div>
    </form>
  );
}
```

## Customization

### Override Colors

Custom colors can be passed through the ColorConfig:

```typescript
const config = {
  customColors: {
    'primary': '#ff0000',
    'secondary': '#00ff00',
  }
};
```

### Extend Role Colors

Add new roles by extending ROLE_COLORS:

```typescript
const CUSTOM_ROLES = {
  ...ROLE_COLORS,
  CUSTOM_ROLE: {
    accent: '#ff00ff',
    accentSoft: '#ffe5ff',
    // ... other properties
  }
};
```

## References

- **WCAG 2.1 Contrast Requirements**: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- **Color Accessibility**: https://www.colourblindawareness.org/
- **Tailwind Colors**: https://tailwindcss.com/docs/customizing-colors

## API Reference

See `/constants/colors` for complete color constants
See `/lib/colors` for utility functions
See `/hooks` for React hooks
