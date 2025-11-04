# Dashboard Page Files for Gemini Redesign

This directory contains all the files needed to redesign the CDBL Leave Management dashboard page.

## File Structure (10 files)

1. **dashboard-page.tsx** - Main dashboard page entry point
2. **EmployeeDashboardUnified.tsx** - Main employee dashboard component (unified layout)
3. **HeroStrip.tsx** - Hero/header component with status messages and quick actions
4. **LeaveSummaryCard.tsx** - Leave balance summary card with progress indicators
5. **requests-table.tsx** - Leave requests table component (recent requests)
6. **card.tsx** - Card UI component (shadcn/ui)
7. **progress.tsx** - Progress bar component (shadcn/ui)
8. **skeleton.tsx** - Loading skeleton component (shadcn/ui)
9. **utils.ts** - Utility functions (cn helper, formatDate, etc.)
10. **globals.css** - Global styles and design system

## Key Components for Redesign

### Primary Components

1. **EmployeeDashboardUnified.tsx** - Main dashboard layout

   - 2-column grid (2/3 for requests, 1/3 for summary)
   - Uses HeroStrip and LeaveSummaryCard

2. **HeroStrip.tsx** - Status banner component

   - Shows pending requests count
   - Displays approved upcoming leave
   - Shows next holiday information
   - Clickable to view pending requests
   - Uses SWR for data fetching

3. **LeaveSummaryCard.tsx** - Balance summary card

   - Shows EARNED, CASUAL, MEDICAL leave balances
   - Progress bars for each leave type
   - Color-coded status (available, warning, low, exhausted)
   - Total remaining days summary
   - Uses SWR for data fetching

4. **requests-table.tsx** - Leave requests table
   - Shows recent leave requests (limit: 3)
   - Status badges
   - Filter options (all, pending, approved, cancelled)
   - Responsive (table on desktop, cards on mobile)
   - Cancel functionality for pending requests

### Supporting Components

5. **card.tsx** - Card component with glassmorphism
6. **progress.tsx** - Progress bar for leave usage
7. **skeleton.tsx** - Loading states
8. **utils.ts** - Utility functions (formatDate, cn)

### Design System

9. **globals.css** - Complete design system
   - Color tokens
   - Glassmorphism effects
   - Animations
   - Dark mode support

## Current Design Features

- **Glassmorphism**: Backdrop blur effects on cards
- **Responsive**: Mobile-friendly with card view on small screens
- **Dark mode support**: Full dark mode styling
- **Loading states**: Skeleton loaders for async data
- **Status indicators**: Color-coded leave balances and request statuses
- **Interactive**: Clickable hero strip, filterable table

## Data Flow

### HeroStrip

- Fetches: `/api/leaves?mine=1` and `/api/holidays?upcoming=true`
- Displays: Pending count, approved upcoming leave, next holiday

### LeaveSummaryCard

- Fetches: `/api/balance/mine`
- Displays: EARNED, CASUAL, MEDICAL balances with progress bars

### RequestsTable

- Fetches: `/api/leaves?mine=1`
- Displays: Recent 3 requests (or all if on full page)
- Supports: Filtering, canceling, viewing details

## Notes for Redesign

- Maintain the data fetching logic (SWR hooks)
- Keep role-based rendering (EmployeeDashboardUnified)
- Preserve accessibility (ARIA labels, keyboard navigation)
- Support both light and dark modes
- Ensure mobile responsiveness
- Keep loading states and error handling
- Maintain the 2-column grid layout (requests left, summary right)
- HeroStrip should remain prominent at the top

## API Endpoints Used

- `GET /api/leaves?mine=1` - User's leave requests
- `GET /api/balance/mine` - User's leave balances
- `GET /api/holidays?upcoming=true` - Upcoming holidays
