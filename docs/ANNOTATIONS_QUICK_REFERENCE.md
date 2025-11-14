# Annotations System - Quick Reference

## Access Admin Panel

```
http://localhost:3000/admin/annotations
```

## Common Usage Patterns

### Pattern 1: Simple Guide

```tsx
import { AccessibilityGuide } from "@/components/shared/AnnotationGuide";

<AccessibilityGuide
  title="Keyboard Support"
  content="Component supports Tab, Enter, and Arrow keys"
/>
```

### Pattern 2: Conditional Rendering

```tsx
import { useAnnotationEnabled } from "@/hooks/useAnnotations";

const showTips = useAnnotationEnabled("accessibility");

{showTips && <InfoBox />}
```

### Pattern 3: Custom Guide

```tsx
import { AnnotationGuide } from "@/components/shared/AnnotationGuide";

<AnnotationGuide
  type="performance"
  title="Lazy Load"
  content="This component uses lazy loading for better performance"
  variant="tip"
/>
```

### Pattern 4: Full Control

```tsx
import { useAnnotations } from "@/hooks/useAnnotations";

const { toggle, getStats, getByCategory } = useAnnotations();

toggle("accessibility");          // Toggle annotation
const stats = getStats();          // Get statistics
const a11y = getByCategory("accessibility"); // Get by category
```

## Available Types

| Type | Category | Icon | Phase |
|------|----------|------|-------|
| accessibility | Accessibility | ♿ | 6 |
| wcag-compliance | Accessibility | ✓ | 6 |
| keyboard-nav | Accessibility | ⌨️ | 6 |
| screen-reader | Accessibility | 🔊 | 6 |
| performance | Performance | ⚡ | 5 |
| error-handling | Quality | 🚨 | 3 |
| testing | Quality | ✅ | 8 |
| logging | Quality | 📝 | 8 |
| security | Security | 🔒 | 8 |
| deployment | Deployment | ☁️ | 8 |
| color-system | Accessibility | 🎨 | 4 |

## Components Available

### Guide Components

- `<AnnotationGuide />` - Base component, full control
- `<AccessibilityGuide />` - Shortcut for a11y
- `<PerformanceGuide />` - Shortcut for performance
- `<SecurityGuide />` - Shortcut for security
- `<KeyboardNavGuide />` - Shortcut for keyboard nav

### Admin Component

- `<AnnotationsManager />` - Full admin interface

## Toggle States

```tsx
// Single annotation
const enabled = useAnnotationEnabled("accessibility");

// Get all enabled
const { getEnabledList } = useAnnotations();
const enabled = getEnabledList(); // Returns array of enabled types

// Toggle
const { toggle } = useAnnotations();
toggle("accessibility"); // Toggles and persists to localStorage
```

## Common Tasks

### Show a tip only when annotation is enabled
```tsx
<AccessibilityGuide
  title="Best Practice"
  content="This is the recommended approach"
/>
// Won't render if accessibility annotation is disabled
```

### Check if annotation is enabled
```tsx
const showAccessibilityHints = useAnnotationEnabled("accessibility");

{showAccessibilityHints && <AccessibilityHints />}
```

### Get statistics
```tsx
const { getStats } = useAnnotations();
const stats = getStats();
// { total: 11, enabled: 8, disabled: 3, byCategory: {...} }
```

### Reset all annotations
```tsx
const { reset } = useAnnotations();
reset(); // Resets to defaults and persists
```

## Variants

The `AnnotationGuide` component supports 4 variants:

- `info` - Blue, informational (ℹ️)
- `tip` - Green, helpful tip (💡)
- `warning` - Yellow, security/caution (⚠️)
- `guide` - Purple, guidance (📖)

```tsx
<AnnotationGuide variant="info" {...props} />
<AnnotationGuide variant="tip" {...props} />
<AnnotationGuide variant="warning" {...props} />
<AnnotationGuide variant="guide" {...props} />
```

## File Locations

- Configuration: `lib/annotations/config.ts`
- Hooks: `hooks/useAnnotations.ts`
- Components: `components/shared/AnnotationGuide.tsx`
- Admin UI: `components/admin/AnnotationsManager.tsx`
- Admin Page: `app/admin/annotations/page.tsx`
- Docs: `docs/ANNOTATIONS_SYSTEM.md`

## Tips

✅ Use during development for best practices
✅ Keep annotations focused and actionable
✅ Toggle via admin panel - no code changes needed
✅ Guides only show when enabled
✅ All changes auto-persist to localStorage
✅ Fully responsive and accessible

❌ Don't disable critical security warnings
❌ Don't overuse - too many annotations is overwhelming
❌ Don't leave broken documentation links

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Annotation not showing | Check if enabled in admin panel |
| Changes not saving | Check localStorage is enabled |
| Admin page not loading | Verify route `/admin/annotations` is accessible |
| Hook not updating | Ensure component is client-side (`"use client"`) |
