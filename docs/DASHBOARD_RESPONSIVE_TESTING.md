# Dashboard Responsive Testing Guide

## Overview

This document provides a comprehensive testing checklist for verifying that all dashboards function correctly across responsive breakpoints and display device sizes. Testing covers layout adaptation, component visibility, animations, and user interactions.

## Testing Methodology

### Test Environment Setup

1. **Browser DevTools Responsive Mode**
   - Open Chrome DevTools (F12 / Cmd+Option+I)
   - Click "Toggle device toolbar" (Ctrl+Shift+M / Cmd+Shift+M)
   - Test each breakpoint size listed below

2. **Real Device Testing**
   - iPhone 12/13/14 (375px width)
   - iPad Air (768px width)
   - Desktop/Laptop (1920px+ width)

### Responsive Breakpoints

| Device | Width | Tailwind | Grid Columns |
|--------|-------|----------|---|
| Mobile | 375px - 639px | sm | 1 |
| Tablet | 640px - 1023px | md | 2 |
| Desktop | 1024px - 1535px | lg | 3-4 |
| Wide | 1536px+ | xl/2xl | 4+ |

## Dashboard-Specific Test Cases

### 1. Employee Dashboard Testing

**Location:** `/dashboard/employee`

#### Mobile Testing (375px)
- [ ] Header displays centered or stacked vertically
- [ ] "Welcome back" title is readable and centered
- [ ] Quick action buttons stack vertically
- [ ] Leave Metrics section shows 1 card per row (from 2:2:4:4 → 2)
- [ ] Cards display full width with adequate padding
- [ ] Recent Actions section displays in single column
- [ ] Leave Overview tabs are accessible and scrollable
- [ ] History & Analytics tabs do not overflow

#### Tablet Testing (768px)
- [ ] Header layout is optimized for horizontal space
- [ ] Leave Metrics shows 2 cards per row (from 2:2:4:4 → 2)
- [ ] Tabs are visible and properly spaced
- [ ] Sidebar content (if any) displays below main content
- [ ] All text is readable without horizontal scrolling
- [ ] Card padding and spacing are appropriate

#### Desktop Testing (1024px)
- [ ] Full 4-column layout for KPI cards (from 2:2:4:4 → 4)
- [ ] Header displays with proper title and subtitle
- [ ] All cards are visible in single row
- [ ] Two-column layouts render correctly
- [ ] Animations are smooth and not jumpy
- [ ] No excessive whitespace or compression

#### Wide Testing (1920px+)
- [ ] Layout does not stretch excessively (max-width: 7xl)
- [ ] Cards maintain readable size
- [ ] Grid gaps remain proportional
- [ ] Animations complete smoothly
- [ ] Content is centered with consistent margins

#### Interaction Testing
- [ ] Loading state displays skeleton on all breakpoints
- [ ] Hover effects work on desktop (cards have subtle highlight)
- [ ] Click interactions (buttons, tabs) work on all sizes
- [ ] Animations trigger on scroll/load
- [ ] No layout shifts when loading completes

### 2. Department Head Dashboard Testing

**Location:** `/dashboard/dept-head`

#### Mobile Testing (375px)
- [ ] KPI cards display 2 per row (from 2:2:4:4 → 2)
- [ ] Pending requests table is scrollable horizontally if needed
- [ ] Table header stays visible when scrolling
- [ ] Team Overview card displays below table
- [ ] Quick Actions card displays as secondary
- [ ] All text is readable

#### Tablet Testing (768px)
- [ ] KPI cards show 2 per row (from 2:2:4:4 → 2)
- [ ] Table fits with minor horizontal scroll if needed
- [ ] Two-column layout for Team & Actions (1 per row on mobile)
- [ ] Section headers are clearly visible
- [ ] Data is presented legibly

#### Desktop Testing (1024px)
- [ ] Full 4-column KPI layout
- [ ] Table displays with comfortable width (full-width layout)
- [ ] Team Overview and Quick Actions sit side-by-side
- [ ] No horizontal scrolling on table
- [ ] All columns visible without compression

#### Wide Testing (1920px+)
- [ ] Full-width layout maintains readability
- [ ] Table columns are well-proportioned
- [ ] No excessive spacing or empty areas
- [ ] Layout uses available width efficiently
- [ ] Content is not too spread out

#### Data Table Testing
- [ ] Headers remain aligned with columns
- [ ] Sorting controls are accessible
- [ ] Pagination controls work on all sizes
- [ ] Row actions (approve, reject) are visible
- [ ] No cell content overflow

#### Performance Testing
- [ ] Table maintains 60fps scroll on mobile
- [ ] Loading state appears quickly
- [ ] Sort operations complete in < 500ms
- [ ] Pagination transitions are smooth

### 3. HR Admin Dashboard Testing

**Location:** `/dashboard/hr-admin`

#### Mobile Testing (375px)
- [ ] Primary KPI cards show 2 per row
- [ ] Secondary metrics section shows full-width cards
- [ ] Daily processing card is readable
- [ ] Pending approvals table is scrollable
- [ ] Section headers stack properly

#### Tablet Testing (768px)
- [ ] Primary KPI cards show 2 per row
- [ ] Secondary metrics show 1 card per row
- [ ] Table displays with adjusted column widths
- [ ] All metrics are visible

#### Desktop Testing (1024px)
- [ ] Primary KPI cards: 4 columns
- [ ] Secondary metrics: 3 columns (1:1:3:3)
- [ ] Table has optimal column spacing
- [ ] Analytics charts are appropriately sized
- [ ] No content overflow

#### Wide Testing (1920px+)
- [ ] Content constrained to max-w-[1600px]
- [ ] Extra space not disproportionately used
- [ ] Table remains readable
- [ ] Charts are appropriately scaled

#### Chart Testing
- [ ] Bar charts render at all breakpoints
- [ ] Y-axis labels are readable
- [ ] Legend is visible and clear
- [ ] Tooltips appear on hover (desktop)
- [ ] Charts are touch-responsive (mobile)

### 4. CEO Dashboard Testing

**Location:** `/dashboard/ceo`

#### Mobile Testing (375px)
- [ ] Executive metrics stack vertically
- [ ] KPI cards show 2 per row
- [ ] Charts render in single column
- [ ] Financial summary is readable
- [ ] YoY analysis displays correctly

#### Tablet Testing (768px)
- [ ] KPI cards: 2 per row
- [ ] Charts arranged in 2-column layout
- [ ] Financial data is clear
- [ ] Analytics section renders properly

#### Desktop Testing (1024px)
- [ ] Full KPI row (4 columns)
- [ ] Main analytics section with 8-column + 4-column sidebar
- [ ] Multiple charts visible
- [ ] Sidebar content is readable
- [ ] Executive summary is accessible

#### Wide Testing (1920px+)
- [ ] Content constrained to max-w-[1800px]
- [ ] Charts are appropriately sized
- [ ] Sidebar and main content maintain good balance
- [ ] No excessive spacing
- [ ] All information remains visible above the fold

#### Analytics Testing
- [ ] Multiple chart types render correctly
- [ ] Pie charts are circular on all sizes
- [ ] Bar charts have proportional axes
- [ ] Line charts are readable
- [ ] Legends are positioned correctly

### 5. HR Head Dashboard Testing

**Location:** `/dashboard/hr-head`

#### Mobile Testing (375px)
- [ ] HR Operations: 2 KPI cards per row
- [ ] Performance & Compliance: 1 card per row
- [ ] Approvals table is scrollable
- [ ] Organization metrics stack
- [ ] Recent activity displays in single column

#### Tablet Testing (768px)
- [ ] HR Operations: 2 cards per row
- [ ] Performance & Compliance: improved layout
- [ ] Approvals section: main + sidebar stack
- [ ] All metrics visible

#### Desktop Testing (1024px)
- [ ] HR Operations: 4 columns
- [ ] Performance & Compliance: 3 columns
- [ ] Approvals: 8-column main + 4-column sidebar
- [ ] Organization metrics are readable
- [ ] Recent activity list is complete

#### Wide Testing (1920px+)
- [ ] Layout constrained appropriately
- [ ] All sections properly spaced
- [ ] No content overflow
- [ ] Charts and tables are readable

#### Multi-Section Testing
- [ ] Section headers are clearly distinct
- [ ] Dividers separate sections visually
- [ ] Section descriptions are visible
- [ ] Navigation between sections is smooth

### 6. System Admin Dashboard Testing

**Location:** `/dashboard/admin`

#### Mobile Testing (375px)
- [ ] System Overview card displays
- [ ] Quick Stats show 1 per row
- [ ] Recent audit logs display as list
- [ ] Quick Access buttons stack vertically
- [ ] Admin header is readable

#### Tablet Testing (768px)
- [ ] System Overview: 1 card
- [ ] Quick Stats: 2 per row
- [ ] Quick Access: 2 per row
- [ ] Logs display with adequate spacing

#### Desktop Testing (1024px)
- [ ] System Overview: full width card
- [ ] Quick Stats: 3 columns
- [ ] Quick Access: 3 buttons per row
- [ ] Audit logs table is readable

#### Wide Testing (1920px+)
- [ ] Content constrained to max-w-[1600px]
- [ ] All sections properly proportioned
- [ ] Admin controls are accessible

## Cross-Cutting Testing

### Loading State Testing (All Dashboards)

Test on all breakpoints:

- [ ] Skeleton loaders appear immediately
- [ ] Skeleton grid matches final grid layout
- [ ] Skeleton cards have appropriate height
- [ ] Skeletons animate smoothly (pulse effect)
- [ ] Content replaces skeletons without layout shift
- [ ] Loading duration is acceptable (< 3 seconds)
- [ ] Multiple sections load independently
- [ ] Error state displays correctly if load fails

### Animation Testing

On Desktop and Tablet:

- [ ] Page entrance animation is smooth
- [ ] Section animations are staggered
- [ ] Cards fade in without jumping
- [ ] No excessive animation lag
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Animation performance: 60fps maintained
- [ ] Animations complete within 0.3-0.4s

### Color & Contrast Testing

On all breakpoints:

- [ ] Role accent colors apply correctly
- [ ] Text contrast meets WCAG AA standards
- [ ] Cards are visually distinct from background
- [ ] Section headers are clearly visible
- [ ] Icon colors are appropriate for role
- [ ] Error/warning colors are visible

### Spacing & Padding Testing

- [ ] Section spacing: consistent space-y-6 (1.5rem)
- [ ] Card padding: consistent p-6 (1.5rem)
- [ ] Grid gaps: consistent gap-6 (1.5rem)
- [ ] Mobile padding: px-4 (1rem)
- [ ] Tablet padding: px-6 (1.5rem)
- [ ] Desktop padding: px-8 (2rem)
- [ ] No clipping or overflow on any size

### Typography Testing

- [ ] Section titles are readable at all sizes
- [ ] Card titles don't wrap excessively on mobile
- [ ] Body text is legible (14px+)
- [ ] Numbers in KPI cards are prominent
- [ ] Metric subtitles are visible
- [ ] Table text is readable
- [ ] No text cut-off at any breakpoint

### Interactive Element Testing

- [ ] Buttons are touch-friendly on mobile (≥44px height)
- [ ] Button spacing prevents accidental clicks
- [ ] Dropdowns open correctly on all sizes
- [ ] Form inputs are appropriately sized
- [ ] Hover effects work on desktop
- [ ] Focus states are visible (keyboard navigation)
- [ ] Links are underlined or clearly styled

### Scroll Behavior Testing

- [ ] No horizontal scroll except for tables (when necessary)
- [ ] Section headers stick/float appropriately
- [ ] Smooth scroll to sections works
- [ ] Scroll performance is smooth (60fps)
- [ ] No jank when scrolling with content loading

### Image & Icon Testing

- [ ] Icons scale appropriately (24px → 16px on mobile)
- [ ] Icons are crisp and not blurry
- [ ] Images don't overflow containers
- [ ] SVG icons render sharply
- [ ] Icon colors match role theme

## Automated Testing Checklist

While manual testing is primary, verify these automated tests pass:

- [ ] Component snapshot tests pass
- [ ] Responsive grid column calculations correct
- [ ] Loading fallback renders without errors
- [ ] Error handling doesn't crash page
- [ ] Role-based styling applies correctly
- [ ] CSS classes apply as expected
- [ ] No console errors on any page
- [ ] No console warnings about unoptimized renders

## Visual Regression Testing Breakpoints

Document visual appearance at these key breakpoints:

1. **Mobile**: 375px (iPhone 12 mini)
2. **Mobile**: 414px (iPhone 12)
3. **Mobile**: 768px (iPad mini - tablet start)
4. **Tablet**: 1024px (iPad Air - desktop start)
5. **Desktop**: 1920px (Full HD)
6. **Desktop**: 2560px (4K - wide start)

## Performance Metrics

Test on all dashboards at mobile breakpoint:

- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] First Input Delay (FID): < 100ms
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] Time to Interactive (TTI): < 3.5s
- [ ] JavaScript execution: < 1s
- [ ] Rendering: 60fps maintained

## Accessibility Testing

- [ ] Keyboard navigation works at all sizes
- [ ] Tab order is logical
- [ ] Focus outline is visible
- [ ] Screen reader announces content correctly
- [ ] Color isn't sole way to convey information
- [ ] Sufficient text contrast (4.5:1 for text, 3:1 for UI)
- [ ] Form labels are properly associated
- [ ] Alt text for images (if any)

## Browser Compatibility Testing

Test on latest versions of:

- [ ] Chrome (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Edge (desktop)
- [ ] Samsung Internet (mobile)

## Testing Report Template

For each dashboard, complete:

```
Dashboard: [Name]
Tested By: [Name]
Date: [Date]
Browser: [Chrome/Firefox/Safari]

Mobile (375px):
  - Layout: [✓ Pass / ✗ Fail / △ Minor Issue]
  - Cards: [✓ Pass / ✗ Fail / △ Minor Issue]
  - Tables: [✓ Pass / ✗ Fail / △ Minor Issue]
  - Text: [✓ Pass / ✗ Fail / △ Minor Issue]
  - Interactions: [✓ Pass / ✗ Fail / △ Minor Issue]
  - Issues: [List any issues found]

Tablet (768px):
  - Layout: [✓ Pass / ✗ Fail / △ Minor Issue]
  - Cards: [✓ Pass / ✗ Fail / △ Minor Issue]
  - [... same as mobile ...]

Desktop (1024px):
  - [... same pattern ...]

Wide (1920px):
  - [... same pattern ...]

Overall Status: [✓ Pass / △ Minor Issues / ✗ Needs Work]
Notes: [Any additional observations]
```

## Test Execution Checklist

- [ ] All dashboards tested at 4 breakpoints
- [ ] Loading states verified at all sizes
- [ ] Error states tested (if applicable)
- [ ] Animation performance confirmed
- [ ] No console errors or warnings
- [ ] Accessibility checks completed
- [ ] Performance metrics within targets
- [ ] Visual regression reviewed
- [ ] Browser compatibility verified
- [ ] Test report documented

## Known Limitations & Acceptable Issues

- [ ] Horizontal table scroll on very small mobile (< 320px) - acceptable
- [ ] Animation skipped on reduced motion devices - expected
- [ ] Wide dashboard (1920px+) constrains to max-width - by design
- [ ] Some charts may be small on mobile - acceptable with touch zoom

## Success Criteria

A dashboard passes responsive testing if:

1. ✓ All content is accessible at 375px width
2. ✓ No horizontal scrolling except for necessary tables
3. ✓ Text is readable at all breakpoints
4. ✓ Interactive elements are touch-friendly on mobile
5. ✓ Animations perform smoothly (60fps)
6. ✓ Loading states display appropriately
7. ✓ No layout shifts after content loads
8. ✓ All sections visible without excessive scrolling
9. ✓ Styling matches role-based theme
10. ✓ No console errors or warnings

## Issue Tracking

If issues are found during testing:

1. Document the issue (breakpoint, dashboard, description)
2. Take a screenshot or screen recording
3. Note reproduction steps
4. Log in issue tracker with priority
5. Reference this testing guide in ticket

## Related Documentation

- `DASHBOARD_LAYOUT_GUIDE.md` - Layout patterns and structure
- `TASK_2_2_IMPLEMENTATION_PLAN.md` - Implementation details
- Individual dashboard component files
