# ActiveRequestsTimeline Component - Redesign Package

This directory contains all files needed for the Gemini redesign of the ActiveRequestsTimeline component, which displays live activity of upcoming/recent leave requests.

## File Structure (5 files)

1. **ActiveRequestsTimeline.tsx** - Main component (shows up to 3 active requests)
2. **api-leaves-route.ts** - Backend API endpoint handler
3. **utils.ts** - Consolidated utilities (formatDate, cn, Card, Skeleton, Progress components)
4. **status-badge.tsx** - Status badge component with Policy v2.0 statuses
5. **globals.css** - Global styles and design system

## Component Overview

The `ActiveRequestsTimeline` component displays up to 3 most recent active leave requests that are:
- Status: `PENDING`, `APPROVED`, or `SUBMITTED`
- End date >= today (upcoming or recent)

### Features

- Shows status badge with icon
- Displays leave type and date range
- Shows days until start for upcoming leaves
- "View All" link to full leaves page
- Loading skeleton state
- Error handling

## API Endpoint

### GET /api/leaves?mine=1

**Authentication:** Required (current user)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "type": "EARNED",
      "startDate": "2025-01-20T00:00:00.000Z",
      "endDate": "2025-01-25T00:00:00.000Z",
      "workingDays": 5,
      "status": "PENDING",
      "approvals": [...]
    }
  ]
}
```

## Usage

```tsx
import { ActiveRequestsTimeline } from "@/components/dashboard/ActiveRequestsTimeline";

export function Dashboard() {
  return (
    <div>
      <ActiveRequestsTimeline />
    </div>
  );
}
```

## Dependencies

### Frontend
- `swr` - Data fetching
- `@/components/ui/card` - Card components (or use from utils.ts)
- `@/components/ui/button` - Button component
- `@/components/ui/skeleton` - Skeleton component (or use from utils.ts)
- `@/components/ui/badge` - Badge component
- `lucide-react` - Icons
- `@/lib/utils` - formatDate utility (or use from utils.ts)
- `@/app/dashboard/components/status-badge` - Status badge (or use status-badge.tsx)

### Backend
- `@/lib/prisma` - Database client
- `@/lib/auth` - Authentication
- `@/lib/errors` - Error handling
- `@/lib/trace` - Tracing

## Component Logic

1. **Data Fetching:** Uses SWR to fetch `/api/leaves?mine=1` with `revalidateOnFocus: true`
2. **Filtering:** Filters leaves where:
   - Status is `PENDING`, `APPROVED`, or `SUBMITTED`
   - End date >= today
3. **Sorting:** Most recent first (from API)
4. **Limiting:** Shows only first 3 items
5. **Date Calculation:** Calculates days until start for upcoming leaves

## Policy v2.0 Status Support

The component supports all Policy v2.0 statuses:
- `SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- `RETURNED`, `CANCELLATION_REQUESTED`, `RECALLED`, `OVERSTAY_PENDING`

## Notes for Redesign

- Maintain the data fetching logic (SWR hooks)
- Keep filtering and sorting logic
- Preserve accessibility (ARIA labels, keyboard navigation)
- Support both light and dark modes
- Ensure mobile responsiveness
- Keep loading states and error handling
- Maintain the card-based layout
- "View All" should navigate to `/leaves`

## Integration

The component automatically handles:
- Loading states (skeleton)
- Error states (returns null)
- Empty states (returns null if no active requests)
- Data revalidation on focus

## Future Enhancements

- Add click handler to navigate to individual leave details
- Add approval timeline visualization
- Add ability to cancel pending requests directly from card
- Add filter options (e.g., show only upcoming, only pending)
