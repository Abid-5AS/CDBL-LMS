# Professional Neo + Glassmorphism Design System

## Overview

This design system combines professional neo aesthetics with glassmorphism effects to create a modern, beautiful, and highly functional user interface.

## Design Principles

1. **Professional & Modern**: Clean, sophisticated look suitable for enterprise applications
2. **User-Friendly**: High contrast colors for better distinction and readability
3. **Accessible**: WCAG AA compliant color combinations
4. **Consistent**: Unified design language across all components
5. **Delightful**: Smooth animations and micro-interactions

## Color Palette

### Leave Types (Professional Neo Colors)

| Leave Type | Primary Color | Gradient | Use Case |
|------------|--------------|----------|----------|
| **Earned Leave** | `#0066FF` (Deep Azure) | Blue gradient | Most common, professional blue |
| **Casual Leave** | `#00D084` (Vibrant Emerald) | Green gradient | Fresh, balanced feeling |
| **Medical Leave** | `#FF3B30` (Critical Red) | Red gradient | High visibility for urgent |
| **Maternity** | `#FF2D55` (Rose Pink) | Pink gradient | Warm, nurturing |
| **Paternity** | `#5E5CE6` (Rich Violet) | Violet gradient | Modern, supportive |
| **Study Leave** | `#FFCC00` (Golden Yellow) | Yellow gradient | Learning, growth |
| **Extra w/ Pay** | `#FF9500` (Bright Orange) | Orange gradient | Premium attention |
| **Extra w/o Pay** | `#8E8E93` (Neutral Gray) | Gray gradient | Standard, neutral |
| **Special Disability** | `#5856D6` (Deep Indigo) | Indigo gradient | Dignified, important |
| **Quarantine** | `#32ADE6` (Sky Blue) | Sky gradient | Health-focused, calm |
| **Special** | `#AF52DE` (Purple) | Purple gradient | Unique, special |

## Glassmorphism Components

### Glass Cards
```typescript
import { glassCard } from '@/lib/neo-design';

// Usage
<Card className={glassCard.base}>...</Card>
<Card className={glassCard.elevated}>...</Card>
<Card className={glassCard.subtle}>...</Card>
<Card className={glassCard.interactive}>...</Card>
```

**Variants:**
- `base`: Standard glass card with backdrop blur
- `elevated`: More prominent, higher contrast
- `subtle`: Lighter, more transparent
- `interactive`: Includes hover effects

### Neo Buttons
```typescript
import { neoButton } from '@/lib/neo-design';

<Button className={neoButton.primary}>Primary Action</Button>
<Button className={neoButton.success}>Success</Button>
<Button className={neoButton.danger}>Delete</Button>
<Button className={neoButton.glass}>Glass Button</Button>
```

### Neo Badges
```typescript
import { neoBadge } from '@/lib/neo-design';

<Badge className={neoBadge.approved}>Approved</Badge>
<Badge className={neoBadge.pending}>Pending</Badge>
<Badge className={neoBadge.rejected}>Rejected</Badge>
<Badge className={neoBadge.glass}>Info</Badge>
```

## Visual Effects

### Glow Effects
Add subtle glow for emphasis:
```typescript
import { neoGlow } from '@/lib/neo-design';

<div className={neoGlow.blue}>...</div>
<div className={neoGlow.emerald}>...</div>
<div className={neoGlow.red}>...</div>
```

### Gradient Backgrounds
```typescript
import { neoGradient } from '@/lib/neo-design';

<div className={neoGradient.page}>...</div>
<div className={neoGradient.card}>...</div>
```

## Implementation Examples

### Calendar Event Badges
Events now use gradient backgrounds with glassmorphism:
- Gradient from primary to lighter shade (135deg)
- Backdrop blur for depth
- Border with subtle white overlay
- Colored shadow for elevation
- White text for maximum contrast (except Study Leave)

### Status Badges
- Approved: Emerald gradient with glow
- Pending: Amber gradient with glow
- Rejected: Red gradient with glow

### Interactive Elements
- Smooth transitions (300ms)
- Hover effects with elevated shadows
- Focus states with ring effects
- Active states with slight scale

## Dark Mode Support

All components automatically adapt to dark mode:
- Darker glass backgrounds
- Adjusted border opacity
- Enhanced shadows for depth
- Maintained color vibrancy

## Accessibility

- Color contrast ratios meet WCAG AA standards
- Distinct colors for colorblind users
- Hover/focus states clearly visible
- Interactive elements have minimum touch target size (44x44px)

## Best Practices

1. **Consistency**: Use the design system utilities instead of custom classes
2. **Layering**: Apply glassmorphism sparingly for depth hierarchy
3. **Performance**: Use `backdrop-blur` judiciously (can be GPU-intensive)
4. **Contrast**: Always ensure sufficient contrast for text readability
5. **Motion**: Keep animations smooth and purposeful (200-300ms)

## Future Enhancements

- [ ] Add micro-interactions library
- [ ] Implement motion presets
- [ ] Create component gallery
- [ ] Add animation utilities
- [ ] Expand color palette for more use cases
