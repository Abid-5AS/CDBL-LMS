# Annotations Management System

A flexible feature toggle system for managing documentation, guides, and annotations without modifying code.

## Overview

The Annotations Management System allows you to:
- **Toggle features on/off** via admin panel
- **No code changes required** - configuration persists in localStorage
- **Categorized by type** - accessibility, performance, security, deployment, quality
- **Phases tracked** - see which phase each annotation belongs to
- **Inline guides** - show contextual help based on enabled annotations

## Quick Start

### 1. Access the Admin Panel

Navigate to `/admin/annotations` to access the Annotations Manager.

**Features:**
- View all 11 built-in annotations
- Toggle annotations by category
- See enablement statistics
- Reset to defaults anytime

### 2. Use in Components

Import and use the annotation guide components:

```tsx
import { AnnotationGuide, AccessibilityGuide } from "@/components/shared/AnnotationGuide";

export function MyComponent() {
  return (
    <div>
      <AccessibilityGuide
        title="Keyboard Navigation"
        content="This component supports full keyboard navigation. Use Tab to navigate and Enter/Space to activate."
      />

      {/* Your component content */}
    </div>
  );
}
```

## Built-in Annotations

### Accessibility (Phase 6)
- **accessibility** - WCAG 2.1 AA compliance checks and screen reader support
- **wcag-compliance** - Web Content Accessibility Guidelines level AA validation
- **keyboard-nav** - Full keyboard support and focus management
- **screen-reader** - ARIA labels, live regions, and announcements

### Performance (Phase 5)
- **performance** - Web Vitals tracking, caching strategies, and optimization

### Quality (Phase 8)
- **error-handling** - React error boundaries with recovery actions
- **testing** - Jest setup, React Testing Library, mock data generation
- **logging** - Structured logging with local/remote transmission

### Security & Deployment (Phase 8)
- **security** - Input validation, XSS/SQL injection detection
- **deployment** - Docker, environment setup, production-ready configuration

### Styling (Phase 4)
- **color-system** - Semantic colors with WCAG contrast validation

## Usage Examples

### Basic Guide Component

```tsx
import { AnnotationGuide } from "@/components/shared/AnnotationGuide";

<AnnotationGuide
  type="accessibility"
  title="Focus Management"
  content="Ensure focus is properly managed when opening dialogs"
  variant="info"
/>
```

### Shortcut Components

```tsx
import {
  AccessibilityGuide,
  PerformanceGuide,
  SecurityGuide,
  KeyboardNavGuide,
} from "@/components/shared/AnnotationGuide";

// Accessibility guidance
<AccessibilityGuide
  title="Alt Text"
  content="Always provide descriptive alt text for images"
/>

// Performance tips
<PerformanceGuide
  title="Image Optimization"
  content="Use Next.js Image component for automatic optimization"
/>

// Security warnings
<SecurityGuide
  title="Input Validation"
  content="Always validate and sanitize user input on the server"
/>

// Navigation help
<KeyboardNavGuide
  title="Tab Order"
  content="Ensure tab order matches visual order for accessibility"
/>
```

### Conditional Rendering with Hooks

```tsx
import { useAnnotationEnabled } from "@/hooks/useAnnotations";

export function Dashboard() {
  const showAccessibilityTips = useAnnotationEnabled("accessibility");
  const showPerformanceHints = useAnnotationEnabled("performance");

  return (
    <div>
      {showAccessibilityTips && (
        <div className="bg-blue-50 p-4 rounded">
          Accessibility tips enabled
        </div>
      )}

      {showPerformanceHints && (
        <div className="bg-yellow-50 p-4 rounded">
          Performance hints enabled
        </div>
      )}
    </div>
  );
}
```

### Full Control with useAnnotations Hook

```tsx
import { useAnnotations } from "@/hooks/useAnnotations";

export function AnnotationSettings() {
  const {
    config,
    toggle,
    reset,
    getEnabledList,
    getByCategory,
    getStats,
  } = useAnnotations();

  const stats = getStats();
  const a11yAnnotations = getByCategory("accessibility");

  return (
    <div>
      <p>Total enabled: {stats.enabled}</p>
      <p>Accessibility features: {a11yAnnotations.length}</p>

      <button onClick={() => toggle("accessibility")}>
        Toggle Accessibility
      </button>

      <button onClick={reset}>Reset All</button>
    </div>
  );
}
```

## API Reference

### Configuration (`lib/annotations/config.ts`)

#### `getAnnotationsConfig(): AnnotationsState`
Get current configuration from localStorage or defaults

#### `isAnnotationEnabled(type: AnnotationType): boolean`
Check if specific annotation is enabled

#### `toggleAnnotation(type: AnnotationType): void`
Toggle an annotation and dispatch change event

#### `getEnabledAnnotations(): AnnotationType[]`
Get all enabled annotation types

#### `getAnnotationsByCategory(category: string): AnnotationType[]`
Get annotations by category

#### `resetAnnotationsConfig(): void`
Reset all annotations to defaults

#### `getAnnotationsStats()`
Get statistics about enabled/disabled annotations

### Hooks (`hooks/useAnnotations.ts`)

#### `useAnnotations()`
Main hook for managing annotations

Returns:
```tsx
{
  config,           // Current AnnotationsState
  isClient,         // Whether component is mounted on client
  toggle,           // Toggle an annotation
  reset,            // Reset to defaults
  isEnabled,        // Check if annotation is enabled
  getEnabledList,   // Get all enabled annotations
  getByCategory,    // Get annotations by category
  getStats,         // Get statistics
}
```

#### `useAnnotationEnabled(type: AnnotationType): boolean`
Simple hook to check if single annotation is enabled

## Adding New Annotations

To add a new annotation type:

1. Add the type to `AnnotationType` in `lib/annotations/config.ts`:
```tsx
export type AnnotationType =
  | "existing-types"
  | "my-new-annotation";  // Add here
```

2. Add configuration to `DEFAULT_ANNOTATIONS`:
```tsx
"my-new-annotation": {
  enabled: true,
  title: "My New Annotation",
  description: "Description of what this annotation does",
  icon: "check-circle",
  category: "quality",
  phase: 9,
  inlineHelp: true,
}
```

3. Use in components:
```tsx
<AnnotationGuide
  type="my-new-annotation"
  title="My Annotation"
  content="Some helpful content"
/>
```

## Storage

Annotations configuration is stored in browser's `localStorage` under the key `annotations_config`.

To manually reset:
```javascript
localStorage.removeItem("annotations_config");
// Then refresh the page
```

## Events

The system dispatches custom events when annotations change:

```tsx
// Listen for specific annotation changes
window.addEventListener("annotations-changed", (event) => {
  console.log(event.detail.type);    // The annotation type
  console.log(event.detail.enabled); // New enabled state
});

// Listen for reset
window.addEventListener("annotations-reset", () => {
  console.log("Annotations reset to defaults");
});
```

## Best Practices

1. **Use in development** - Ideal for showing best practices and tips during development
2. **Keep content focused** - Each annotation should provide specific, actionable guidance
3. **Update documentation** - When enabling annotations, ensure documentation is up-to-date
4. **Mobile responsive** - Admin panel is fully responsive
5. **Accessibility first** - All guides follow WCAG 2.1 AA standards

## Troubleshooting

### Annotations not appearing

1. Check if annotation type is enabled in admin panel
2. Verify component is rendering on client side (use `useAnnotationEnabled`)
3. Check browser console for errors

### Changes not persisting

1. Check browser's localStorage is enabled
2. Try clearing localStorage and resetting
3. Check for browser privacy mode restrictions

### Admin panel not loading

Ensure `/admin/annotations` route is accessible and user has appropriate permissions.

## Related Documentation

- [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) - Full accessibility features
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment configuration
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Complete project overview
