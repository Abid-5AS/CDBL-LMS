# ActiveRequestsTimeline Component

## Overview

The `ActiveRequestsTimeline` component displays up to 3 most recent active leave requests that are either pending approval or approved, and are upcoming or recently ended. It provides a quick overview of the user's active leave activity.

## Features

- Shows up to 3 most recent active requests
- Filters for:
  - Status: `PENDING`, `APPROVED`, or `SUBMITTED`
  - End date >= today (upcoming or recent)
- Displays:
  - Status badge with icon
  - Leave type
  - Date range (start → end)
  - Days until start (for upcoming leaves)
- "View All" link to full leaves page
- Loading skeleton state
- Error handling (returns null on error)

## Files Included

### Frontend Components
- `ActiveRequestsTimeline.tsx` - Main component
- `status-badge.tsx` - Status badge component (for reference)
- `utils-formatDate.ts` - Date formatting utility

### Backend API
- `api-leaves-route.ts` - GET /api/leaves endpoint handler

## Dependencies

### Frontend
```typescript
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/app/dashboard/components/status-badge";
```

### Backend
```typescript
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
```

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
      "approvals": [
        {
          "step": 1,
          "approver": {
            "name": "HR Admin"
          }
        }
      ]
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

## Component Logic

1. **Data Fetching:** Uses SWR to fetch `/api/leaves?mine=1` with `revalidateOnFocus: true`
2. **Filtering:** Filters leaves where:
   - Status is `PENDING`, `APPROVED`, or `SUBMITTED`
   - End date >= today
3. **Sorting:** Most recent first (from API)
4. **Limiting:** Shows only first 3 items
5. **Date Calculation:** Calculates days until start for upcoming leaves

## Styling

- Card with blue border and light blue background
- Each request item has white background with hover effects
- Status badge with color coding
- Calendar icon for days until start indicator

## Policy v2.0 Status Support

The component supports all Policy v2.0 statuses:
- `SUBMITTED`
- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `RETURNED` (Policy v2.0)
- `CANCELLATION_REQUESTED` (Policy v2.0)
- `RECALLED` (Policy v2.0)
- `OVERSTAY_PENDING` (Policy v2.0)

## Integration Notes

- The component automatically handles loading and error states
- Returns `null` if there are no active requests (no empty state)
- Uses SWR for automatic revalidation and caching
- Clicking "View All" navigates to `/leaves` page

## Future Enhancements

- Add click handler to navigate to individual leave details
- Add approval timeline visualization
- Add ability to cancel pending requests directly from card
- Add filter options (e.g., show only upcoming, only pending)

