# Accessibility Guide

## Overview

The CDBL-LMS application is built with accessibility as a core principle, targeting **WCAG 2.1 AA** compliance. This guide covers the accessibility features, utilities, and best practices.

## Quick Start

### Initialize Accessibility Auditing

```typescript
import { useAccessibilityAudit } from "@/hooks";

function App() {
  const { audit, wcag, score } = useAccessibilityAudit({
    autoRun: true,
    logResults: true,
    checkWCAG: true,
  });

  return <div>Accessibility Score: {score}%</div>;
}
```

### Add Focus Trap for Modals

```typescript
import { FocusTrap } from "@/components/accessibility";

function Modal({ isOpen, onClose }) {
  return (
    <FocusTrap active={isOpen} onEscape={onClose}>
      <div role="dialog" aria-modal="true">
        {/* modal content */}
      </div>
    </FocusTrap>
  );
}
```

### Announce to Screen Readers

```typescript
import { useScreenReaderAnnouncement } from "@/hooks";

function Form() {
  const { announceSuccess, announceError } = useScreenReaderAnnouncement();

  const handleSubmit = async () => {
    try {
      await submit();
      announceSuccess("Form submitted successfully");
    } catch (error) {
      announceError("Form submission failed");
    }
  };
}
```

## Accessibility Features

### 1. Comprehensive Auditing

**Files:**
- `lib/accessibility/audit.ts` - Accessibility auditor
- `lib/accessibility/wcag.ts` - WCAG 2.1 AA checker
- `hooks/useAccessibilityAudit.ts` - React hook

**Features:**
- Automatic accessibility scanning
- WCAG 2.1 AA compliance checking
- Issue reporting with severity levels
- Score calculation and export
- HTML and JSON reporting

**Usage:**

```typescript
import { runAccessibilityAudit, getAuditSummary } from "@/lib/accessibility";

const result = runAccessibilityAudit();
console.log(getAuditSummary(result));
// Score: 95%
// Total Issues: 2 (0 errors, 2 warnings, 0 notices)
```

### 2. Keyboard Navigation & Focus Management

**Files:**
- `lib/accessibility/keyboard.ts` - Keyboard utilities
- `hooks/useKeyboardNav.ts` - React hook
- `components/accessibility/FocusTrap.tsx` - Focus trap component

**Features:**
- Tab key navigation
- Focus trapping for modals
- Arrow key navigation
- Skip to content links
- Keyboard event handling

**Usage:**

```typescript
import { useKeyboardNav } from "@/hooks";

function Menu() {
  const containerRef = useRef<HTMLDivElement>(null);

  useKeyboardNav({
    containerRef,
    trapFocus: false,
    arrowNavigation: true,
    arrowOrientation: "horizontal",
    handlers: {
      onEscape: () => closeMenu(),
    },
  });

  return <div ref={containerRef}>{/* menu items */}</div>;
}
```

### 3. ARIA & Semantic HTML

**Files:**
- `lib/accessibility/aria.ts` - ARIA utilities

**Features:**
- ARIA attribute builder
- Semantic element mapping
- Landmark region helpers
- Live region creation
- Tab and panel utilities

**Usage:**

```typescript
import { aria, liveRegion } from "@/lib/accessibility";

// Build ARIA attributes fluently
const attrs = aria()
  .label("Close dialog")
  .disabled(false)
  .build();

// Create live region attributes
const regionAttrs = liveRegion("assertive", true);

// Get error attributes
const errorAttrs = errorAttributes("input-id", "error-id");
```

### 4. Screen Reader Support

**Files:**
- `lib/accessibility/screenReader.ts` - Screen reader utilities
- `hooks/useScreenReaderAnnouncement.ts` - React hook

**Features:**
- Screen reader only text
- Live region announcements
- Error/success/loading messages
- Skip links
- Table and list helpers

**Usage:**

```typescript
import {
  screenReaderOnlyStyles,
  getGlobalAnnouncer,
  createSkipLink,
} from "@/lib/accessibility";

// Add screen reader only text
<span style={screenReaderOnlyStyles}>
  Additional information for screen readers
</span>

// Make announcement
getGlobalAnnouncer().announceSuccess("Operation completed");

// Add skip link
<div dangerouslySetInnerHTML={{ __html: createSkipLink() }} />
```

### 5. Accessibility Hooks

#### useAccessibilityAudit

Runs accessibility audits automatically and provides detailed reports.

```typescript
const {
  audit,           // AccessibilityAuditResult
  wcag,            // WCAGComplianceReport
  isRunning,       // boolean
  score,           // number
  hasErrors,       // boolean
  runAudit,        // () => Promise<void>
  exportAsJSON,    // () => string
} = useAccessibilityAudit();
```

#### useKeyboardNav

Handles keyboard navigation and focus management.

```typescript
const {
  focusNextElement,
  focusPreviousElement,
  setFocus,
} = useKeyboardNav({
  trapFocus: true,
  handlers: { onEscape: () => {} },
});
```

#### useScreenReaderAnnouncement

Makes screen reader announcements.

```typescript
const {
  announce,
  announceError,
  announceSuccess,
  announceLoading,
  clear,
} = useScreenReaderAnnouncement();
```

## WCAG 2.1 AA Compliance Checklist

### Perceivable

- [x] **1.1.1 Non-text Content** - All images have alt text
- [x] **1.2.1 Audio-only and Video-only** - Videos have captions
- [x] **1.3.1 Info and Relationships** - Proper heading hierarchy
- [x] **1.4.4 Resize Text** - Text can be resized
- [x] **1.4.5 Images of Text** - Text not rendered as images

### Operable

- [x] **2.1.1 Keyboard** - All functionality keyboard accessible
- [x] **2.1.2 No Keyboard Trap** - Focus not trapped without escape
- [x] **2.4.1 Bypass Blocks** - Skip links available
- [x] **2.4.7 Focus Visible** - Focus indicators visible
- [x] **2.5.1 Pointer Gestures** - Accessible alternatives for gestures

### Understandable

- [x] **3.1.1 Language of Page** - Lang attribute present
- [x] **3.2.2 On Input** - No auto-submit forms
- [x] **3.3.1 Error Identification** - Errors identified clearly
- [x] **3.3.4 Error Prevention** - Prevention for important actions

### Robust

- [x] **4.1.1 Parsing** - No parsing errors
- [x] **4.1.2 Name, Role, Value** - All elements have accessible names
- [x] **4.1.3 Status Messages** - Status messages announced

## Best Practices

### 1. Semantic HTML First

Always prefer semantic HTML over ARIA:

```typescript
// ❌ Bad: Using ARIA instead of semantic HTML
<div role="button" onClick={handleClick}>Click me</div>

// ✅ Good: Using semantic HTML
<button onClick={handleClick}>Click me</button>
```

### 2. ARIA When Necessary

Use ARIA to enhance, not replace:

```typescript
// ✅ Good: ARIA enhancing semantic HTML
<button aria-expanded={isExpanded} onClick={toggle}>
  Menu
</button>
```

### 3. Keyboard Support

Ensure all interactive elements are keyboard accessible:

```typescript
// ✅ Good: Keyboard accessible
<button onClick={handleClick} onKeyDown={handleKeyDown}>
  Action
</button>

// Also: Ensure Tab order is logical
// Use tabindex sparingly and avoid tabindex > 0
```

### 4. Focus Management

Always provide clear focus indicators:

```css
/* ✅ Good: Visible focus indicator */
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ❌ Bad: Removing focus without alternative */
button:focus {
  outline: none;
}
```

### 5. Color Contrast

Maintain WCAG AA contrast ratio (4.5:1 for text):

```typescript
import { meetsWCAGAA } from "@/lib/colors/contrast";

if (meetsWCAGAA("#ffffff", "#333333")) {
  // Safe to use this color combination
}
```

### 6. Labels & Descriptions

Always associate form labels:

```typescript
// ✅ Good: Label associated with input
<label htmlFor="email">Email:</label>
<input id="email" type="email" />

// ✅ Good: Error described to input
<input aria-describedby="error-message" />
<div id="error-message" role="alert">Invalid email</div>
```

### 7. Live Regions

Announce dynamic updates to screen readers:

```typescript
// ✅ Good: Announce status changes
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

## Common Patterns

### Accessible Modal

```typescript
<FocusTrap
  active={isOpen}
  onEscape={onClose}
  initialFocus={closeButtonRef}
>
  <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <h1 id="dialog-title">Dialog Title</h1>
    <p>Content...</p>
    <button ref={closeButtonRef} onClick={onClose}>
      Close
    </button>
  </div>
</FocusTrap>
```

### Accessible Form

```typescript
<form onSubmit={handleSubmit}>
  <label htmlFor="name">Name:</label>
  <input
    id="name"
    type="text"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby="name-error"
  />
  {hasError && (
    <div id="name-error" role="alert">
      Name is required
    </div>
  )}
  <button type="submit">Submit</button>
</form>
```

### Accessible Tab Component

```typescript
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === "tab1"}
    aria-controls="panel1"
    onClick={() => setActiveTab("tab1")}
  >
    Tab 1
  </button>
  <button
    role="tab"
    aria-selected={activeTab === "tab2"}
    aria-controls="panel2"
    onClick={() => setActiveTab("tab2")}
  >
    Tab 2
  </button>
</div>

<div id="panel1" role="tabpanel" aria-labelledby="tab1" hidden={activeTab !== "tab1"}>
  Content 1
</div>
<div id="panel2" role="tabpanel" aria-labelledby="tab2" hidden={activeTab !== "tab2"}>
  Content 2
</div>
```

## Testing Accessibility

### Using Accessibility Audit Hook

```typescript
const { audit, runAudit } = useAccessibilityAudit();

useEffect(() => {
  runAudit();
}, []);

if (audit) {
  console.log(`Accessibility Score: ${audit.scorePercentage}%`);
  console.log(`Issues: ${audit.totalIssues}`);
  console.table(audit.issues);
}
```

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify tab order makes sense
   - Ensure all functions work via keyboard

2. **Screen Reader Testing**
   - Test with NVDA (Windows), JAWS, or VoiceOver (Mac)
   - Verify all content is announced
   - Check image alt text
   - Test form labels and error messages

3. **Visual Testing**
   - Check focus indicators are visible
   - Verify color contrast
   - Test text resizing
   - Check responsive layout

## Accessibility Standards

The CDBL-LMS targets:

- **WCAG 2.1 Level AA** - Minimum standard
- **WCAG 2.1 Level AAA** - Target for critical features
- **Section 508 Compliance** - US government requirement
- **EN 301 549** - European standard

## Common Accessibility Issues

### Issue: Missing Alt Text
```typescript
// ❌ Bad
<img src="logo.png" />

// ✅ Good
<img src="logo.png" alt="Company Logo" />
```

### Issue: Poor Focus Management
```typescript
// ❌ Bad: Modal doesn't trap focus
<div className="modal">{content}</div>

// ✅ Good: Modal traps focus
<FocusTrap active={isOpen}>
  <div role="dialog" aria-modal="true">{content}</div>
</FocusTrap>
```

### Issue: Missing Form Labels
```typescript
// ❌ Bad: No label
<input type="email" placeholder="Email" />

// ✅ Good: Associated label
<label htmlFor="email">Email:</label>
<input id="email" type="email" />
```

### Issue: Low Color Contrast
```typescript
// ❌ Bad: Insufficient contrast
<span style={{ color: "#aaa", backgroundColor: "#fff" }}>Text</span>

// ✅ Good: Sufficient contrast
<span style={{ color: "#333", backgroundColor: "#fff" }}>Text</span>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11yProject](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Getting Help

For accessibility issues or questions:

1. Check the accessibility audit results
2. Review this guide and WCAG checklist
3. Test with screen readers
4. Consult Web Accessibility guidelines
5. Report issues and improvements

## Next Steps

- [ ] Run accessibility audit on all pages
- [ ] Fix critical issues (errors)
- [ ] Address warnings and notices
- [ ] Implement skip links
- [ ] Add focus management to modals
- [ ] Test with screen readers
- [ ] Document custom accessibility patterns
