# Developer Annotation Mode

A comprehensive annotation system that helps developers understand components, their purposes, and backend connections throughout the codebase.

## Overview

The Developer Annotation Mode is a toggle-based UI annotation system that provides:

- **Visual Markers**: Indicates annotated components with colored badges
- **Detailed Information**: Shows component purpose, API connections, database models, and workflows
- **Flexible Display**: Choose between always-visible, hover-to-show, or click-to-show modes
- **Filtering**: Filter annotations by category and type
- **Persistence**: Settings are saved to localStorage

## Features

### 1. Annotation Categories

- `data-flow`: How data moves through the system
- `user-action`: User interaction points
- `state-management`: State handling and updates
- `api-integration`: Backend API connections
- `business-logic`: Core business rules
- `ui-presentation`: UI rendering logic

### 2. Annotation Types

- `component`: React components
- `api`: API routes and endpoints
- `hook`: Custom React hooks
- `service`: Service layer logic
- `utility`: Utility functions
- `database`: Database models and queries
- `workflow`: Business workflows

### 3. Display Modes

- **Always**: Show all annotations immediately
- **Hover**: Show annotations when hovering over components
- **Click**: Show annotations when clicking the marker

## Setup

### 1. Add the Provider to Your App

Wrap your application with the `AnnotationModeProvider`:

```tsx
// app/layout.tsx or app/providers.tsx
import { AnnotationModeProvider } from "@/components/providers/AnnotationModeProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnnotationModeProvider>
          {children}
        </AnnotationModeProvider>
      </body>
    </html>
  );
}
```

### 2. Add the Toggle Button

Include the `AnnotationModeToggle` component in your app layout:

```tsx
// app/layout.tsx or components/layout/MainLayout.tsx
import { AnnotationModeToggle } from "@/components/shared";

export function MainLayout({ children }) {
  return (
    <div>
      {children}
      <AnnotationModeToggle />
    </div>
  );
}
```

**Note**: The toggle only appears in development mode (`NODE_ENV === 'development'`).

### 3. Annotate Components

Wrap components you want to annotate with the `AnnotationMarker`:

```tsx
import { AnnotationMarker } from "@/components/shared";
import { getAnnotationById } from "@/lib/annotations/registry";

export function PendingTable() {
  const annotation = getAnnotationById("dept-head-pending-table");

  return (
    <AnnotationMarker annotation={annotation}>
      <div className="pending-table">
        {/* Your component content */}
      </div>
    </AnnotationMarker>
  );
}
```

## Creating Annotations

### 1. Define Annotation in Registry

Add your annotation to `/lib/annotations/registry.ts`:

```typescript
{
  id: "my-component-id",
  title: "My Component Name",
  description: "What this component does and why it exists",
  type: "component",
  category: "ui-presentation",
  filePath: "components/my-component.tsx",
  lineNumber: 42,

  // Backend connections
  apiEndpoints: [
    "GET /api/my-data",
    "POST /api/my-action"
  ],
  dbModels: ["User", "LeaveRequest"],

  // Code references
  keyFunctions: ["useMyHook", "handleAction"],
  relatedFiles: [
    "hooks/useMyHook.ts",
    "lib/services/MyService.ts"
  ],

  // Documentation
  workflow: "1. User clicks → 2. Validate → 3. Send to API → 4. Update UI",
  dataFlow: "Props → Component State → API Call → Cache Update → Re-render",

  notes: [
    "Uses optimistic updates for better UX",
    "Implements error boundaries",
    "Supports keyboard shortcuts"
  ],

  tags: ["approval", "table", "data-grid"]
}
```

### 2. Annotation Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (required) |
| `title` | string | Display name (required) |
| `description` | string | What it does (required) |
| `type` | AnnotationType | Annotation type (required) |
| `category` | AnnotationCategory | Functional category (required) |
| `filePath` | string | File location (required) |
| `lineNumber` | number | Line number in file (optional) |
| `apiEndpoints` | string[] | Connected API endpoints (optional) |
| `dbModels` | string[] | Database models used (optional) |
| `keyFunctions` | string[] | Important functions (optional) |
| `relatedFiles` | string[] | Related code files (optional) |
| `workflow` | string | Business workflow (optional) |
| `dataFlow` | string | Data flow description (optional) |
| `notes` | string[] | Important notes (optional) |
| `tags` | string[] | Searchable tags (optional) |

## Usage

### 1. Toggling Annotation Mode

- **Floating Button**: Click the blue floating button in bottom-right corner
- **Keyboard Shortcut**: Press `Ctrl+Shift+A` (customizable)

### 2. Viewing Annotations

Once enabled, you'll see colored badges on annotated components:

- 🔵 Blue: Components
- 🟢 Green: API Routes
- 🟣 Purple: Hooks
- 🟠 Orange: Services
- 🔷 Cyan: Utilities
- 🔴 Pink: Database
- 🟡 Amber: Workflows

### 3. Configuring Display

Click the "Settings" button to:

- Change display mode (always/hover/click)
- Filter by categories
- Filter by types
- Adjust opacity
- Reset to defaults

### 4. Reading Annotations

Hover over (or click) an annotated component to see:

- **Header**: Component name and file location
- **Description**: What it does
- **Type & Category**: Classification badges
- **API Endpoints**: Connected backend routes
- **Database Models**: Data models used
- **Key Functions**: Important functions
- **Workflow**: Step-by-step process
- **Data Flow**: How data moves
- **Related Files**: Linked code files
- **Notes**: Developer tips
- **Tags**: Searchable keywords

## Best Practices

### 1. When to Add Annotations

Add annotations for:
- ✅ Complex components with multiple responsibilities
- ✅ Components that connect to multiple APIs
- ✅ Business-critical workflows
- ✅ Reusable hooks and services
- ✅ Components new developers struggle to understand

Avoid annotating:
- ❌ Simple presentational components
- ❌ UI-only components without logic
- ❌ Well-documented standard patterns

### 2. Writing Good Descriptions

**Good**:
> "Displays leave requests pending approval by department heads. Includes filtering, pagination, and quick action buttons for approve/reject/forward/return actions."

**Bad**:
> "A table component for pending stuff."

### 3. Documenting Workflows

Be specific and actionable:

**Good**:
```
1. User clicks Forward button
2. Validate user has permission
3. Determine next approver in chain
4. Update approval record in DB
5. Send notification email
6. Refresh table with optimistic update
7. Show success toast
```

**Bad**:
```
Forwards the request to someone.
```

### 4. Linking Related Files

Always include related files to help developers navigate:

```typescript
relatedFiles: [
  "hooks/usePendingRequests.ts",      // Data fetching
  "lib/services/ApprovalService.ts",  // Business logic
  "app/api/approvals/[id]/route.ts",  // Backend endpoint
]
```

## Examples

### Example 1: Annotating a Table Component

```tsx
// components/dashboards/dept-head/sections/PendingTable.tsx
import { AnnotationMarker } from "@/components/shared";
import { annotationRegistry } from "@/lib/annotations/registry";

export function DeptHeadPendingTable({ data, isLoading, error, onMutate }) {
  const annotation = annotationRegistry.find(
    (a) => a.id === "dept-head-pending-table"
  );

  return (
    <AnnotationMarker annotation={annotation}>
      <div className="glass-card rounded-2xl">
        {/* Table implementation */}
      </div>
    </AnnotationMarker>
  );
}
```

### Example 2: Annotating a Custom Hook

```tsx
// hooks/usePendingRequests.ts
import { AnnotationMarker } from "@/components/shared";
import { getAnnotationById } from "@/lib/annotations/registry";

// Note: For hooks, you might document them in the registry
// but not wrap them with AnnotationMarker
// Instead, annotate the components that USE the hook
```

### Example 3: Multiple Annotations in One Component

```tsx
export function Dashboard() {
  const tableAnnotation = getAnnotationById("pending-table");
  const chartAnnotation = getAnnotationById("analytics-chart");

  return (
    <div>
      <AnnotationMarker annotation={tableAnnotation}>
        <PendingTable />
      </AnnotationMarker>

      <AnnotationMarker annotation={chartAnnotation}>
        <AnalyticsChart />
      </AnnotationMarker>
    </div>
  );
}
```

## Keyboard Shortcuts

- `Ctrl+Shift+A`: Toggle annotation mode
- `Esc`: Close expanded annotation (when in click mode)

## Troubleshooting

### Annotations not showing

1. Check that `AnnotationModeProvider` is wrapping your app
2. Verify you're in development mode (`NODE_ENV === 'development'`)
3. Ensure the annotation is in the registry
4. Check that the annotation's type and category are not filtered out

### Toggle button not visible

1. Verify `NODE_ENV === 'development'`
2. Check z-index conflicts with other fixed/sticky elements
3. Ensure `AnnotationModeToggle` is rendered in your layout

### Annotations overlap or look broken

1. Adjust the `opacity` setting in annotation mode
2. Check parent container positioning
3. Ensure adequate spacing around annotated components
4. Use "Hover" or "Click" mode instead of "Always" for dense UIs

## Performance Considerations

- Annotations only load in development mode
- Settings are persisted to localStorage (< 1KB)
- No impact on production builds
- Markers use CSS transforms for smooth animations
- Annotation data is code-split and lazy-loaded

## Future Enhancements

Potential improvements:

- [ ] Search functionality to find annotations by keyword
- [ ] Export annotation map as documentation
- [ ] Visual flow diagrams connecting related annotations
- [ ] Integration with IDE to jump to file/line
- [ ] Collaborative annotations (team members can add notes)
- [ ] Version history for annotations
- [ ] Auto-generate annotations from JSDoc comments

## Contributing

When adding new features or components:

1. Create annotation in `/lib/annotations/registry.ts`
2. Wrap component with `<AnnotationMarker>`
3. Document workflows and data flows
4. Link related files
5. Add relevant tags for searchability

## Support

For questions or issues with the annotation system:

1. Check this documentation
2. Review example annotations in the registry
3. Ask in team chat or code review
4. Submit issue to repository

---

**Remember**: Good annotations help new team members onboard faster and reduce "how does this work?" questions! 🚀
