# Development Playbook
## Your Guide to Maintaining and Extending the Refactored Codebase

**Last Updated:** November 13, 2025
**Refactoring Version:** Phase 1-3 Complete

---

## 📚 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Shared Components Usage](#shared-components-usage)
3. [Service Layer Pattern](#service-layer-pattern)
4. [Common Tasks](#common-tasks)
5. [File Organization](#file-organization)
6. [Best Practices](#best-practices)
7. [Testing Guidelines](#testing-guidelines)

---

## 🎯 Quick Reference

### When You Need...

| Need | Use | Location |
|------|-----|----------|
| Pagination | `<ScrollingPagination />` or `<SimplePagination />` | `@/components/shared` |
| Loading state | `<LoadingSpinner />` | `@/components/shared` |
| Empty state | `<NoResultsState />` or `<AllClearState />` | `@/components/shared` |
| Approval dialog | `<ApprovalDialog />`, `<RejectDialog />`, etc. | `@/components/shared` |
| Filter components | `<StatusFilter />`, `<LeaveTypeFilter />` | `@/components/shared` |
| Search bar | `<SearchWithClear />` | `@/components/shared` |
| Business logic | `LeaveService`, `LeaveValidator` | `@/lib/services` |
| Database queries | `LeaveRepository` | `@/lib/repositories` |
| Constants | `LEAVE_TYPE_OPTIONS`, `getStatusOptions()` | `@/lib/constants` |

---

## 🧩 Shared Components Usage

### Pagination

#### ScrollingPagination (Recommended for tables)
```typescript
import { ScrollingPagination } from "@/components/shared";

<ScrollingPagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  scrollToElementId="table-top"  // Auto-scrolls to this element
  className="mt-4"
/>
```

#### SimplePagination (For simple prev/next)
```typescript
import { SimplePagination } from "@/components/shared";

<SimplePagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  showPageInfo={true}  // Shows "Page X of Y"
/>
```

#### CompletePagination (With results info)
```typescript
import { CompletePagination } from "@/components/shared";

<CompletePagination
  currentPage={page}
  totalPages={totalPages}
  pageSize={pageSize}
  totalItems={totalItems}
  onPageChange={setPage}
/>
```

---

### Loading States

#### Simple Loading Spinner
```typescript
import { LoadingSpinner } from "@/components/shared";

// In a component
if (isLoading) {
  return <LoadingSpinner message="Loading data..." />;
}
```

#### Loading Card (for card layouts)
```typescript
import { LoadingCard } from "@/components/shared";

if (isLoading) {
  return <LoadingCard message="Loading requests..." />;
}
```

#### Table Loading Skeleton
```typescript
import { TableLoadingSkeleton } from "@/components/shared";

if (isLoading) {
  return <TableLoadingSkeleton rows={5} columns={4} />;
}
```

#### Inline Loading (in buttons)
```typescript
import { InlineLoading } from "@/components/shared";

<Button disabled={isSaving}>
  {isSaving ? <InlineLoading text="Saving" /> : "Save"}
</Button>
```

---

### Empty States

#### No Results (after search/filter)
```typescript
import { NoResultsState } from "@/components/shared";

if (filteredItems.length === 0) {
  return (
    <NoResultsState
      searchQuery={searchQuery}
      onClear={clearFilters}
    />
  );
}
```

#### All Clear (success state)
```typescript
import { AllClearState } from "@/components/shared";

if (pendingItems.length === 0) {
  return (
    <AllClearState
      title="All caught up!"
      description="No pending approvals at the moment."
    />
  );
}
```

#### Error State
```typescript
import { ErrorState } from "@/components/shared";

if (error) {
  return (
    <ErrorState
      title="Failed to load data"
      message={error.message}
      onRetry={refetch}
    />
  );
}
```

#### Domain-Specific Empty States
```typescript
import {
  NoHolidaysState,
  NoLeaveRequestsState,
  NoTeamMembersState
} from "@/components/shared";

// Use these for specific contexts
<NoHolidaysState onAdd={() => setAddDialogOpen(true)} />
<NoLeaveRequestsState />
<NoTeamMembersState />
```

---

### Approval Dialogs

#### Basic Usage
```typescript
import {
  ApprovalDialog,
  RejectDialog,
  ReturnDialog,
  ForwardDialog,
  CancelDialog,
} from "@/components/shared";

// In your component
const [approveDialogOpen, setApproveDialogOpen] = useState(false);
const [currentLeaveId, setCurrentLeaveId] = useState<number | null>(null);

<ApprovalDialog
  open={approveDialogOpen}
  onOpenChange={setApproveDialogOpen}
  onConfirm={() => handleApprove(currentLeaveId)}
  leaveType="Earned Leave"
  employeeName="John Doe"
  isLoading={isProcessing}
/>
```

#### With Comment/Reason
```typescript
// ReturnDialog requires a comment
<ReturnDialog
  open={returnDialogOpen}
  onOpenChange={setReturnDialogOpen}
  onConfirm={(comment) => handleReturn(leaveId, comment)}
  isLoading={isProcessing}
/>

// ForwardDialog accepts optional comment
<ForwardDialog
  open={forwardDialogOpen}
  onOpenChange={setForwardDialogOpen}
  onConfirm={(comment) => handleForward(leaveId, comment)}
  nextApprover="HR Head"
  isLoading={isProcessing}
/>

// CancelDialog requires a reason
<CancelDialog
  open={cancelDialogOpen}
  onOpenChange={setCancelDialogOpen}
  onConfirm={(reason) => handleCancel(leaveId, reason)}
  isLoading={isProcessing}
/>
```

---

### Filter Components

#### Status Filter
```typescript
import { StatusFilter } from "@/components/shared";

<StatusFilter
  selectedStatus={statusFilter}
  onStatusChange={setStatusFilter}
  userRole={user.role}  // Role-aware options
/>
```

#### Leave Type Filter
```typescript
import { LeaveTypeFilter } from "@/components/shared";

<LeaveTypeFilter
  selectedType={typeFilter}
  onTypeChange={setTypeFilter}
/>
```

#### Combined Filter Section
```typescript
import { CombinedFilterSection } from "@/components/shared";

<CombinedFilterSection
  selectedStatus={statusFilter}
  selectedType={typeFilter}
  onStatusChange={setStatusFilter}
  onTypeChange={setTypeFilter}
  userRole={user.role}
  sticky={true}  // Makes it sticky on scroll
/>
```

#### Search Bar
```typescript
import { SearchWithClear } from "@/components/shared";

<SearchWithClear
  searchValue={search}
  onSearchChange={setSearch}
  onClearFilters={clearAllFilters}
  hasActiveFilters={hasFilters}
  placeholder="Search by employee, type, or reason..."
/>
```

---

## 🏗️ Service Layer Pattern

### Architecture Overview

```
API Route (HTTP Layer)
    ↓
Service (Business Logic)
    ↓
Repository (Database)
```

### Creating a New Service

```typescript
// lib/services/my-feature.service.ts
import { MyRepository } from "@/lib/repositories/my-feature.repository";

export type CreateMyFeatureDTO = {
  name: string;
  description: string;
};

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};

export class MyFeatureService {
  static async create(
    userId: number,
    dto: CreateMyFeatureDTO
  ): Promise<ServiceResult<any>> {
    try {
      // 1. Validate
      if (!dto.name || dto.name.length < 3) {
        return {
          success: false,
          error: {
            code: "invalid_name",
            message: "Name must be at least 3 characters",
          },
        };
      }

      // 2. Business logic
      const data = await MyRepository.create({
        userId,
        name: dto.name,
        description: dto.description,
      });

      // 3. Return success
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("MyFeatureService.create error:", error);
      return {
        success: false,
        error: {
          code: "internal_error",
          message: "Failed to create feature",
        },
      };
    }
  }
}
```

### Creating a Repository

```typescript
// lib/repositories/my-feature.repository.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const DEFAULT_INCLUDES = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.MyFeatureInclude;

export class MyFeatureRepository {
  static async findById(id: number) {
    return prisma.myFeature.findUnique({
      where: { id },
      include: DEFAULT_INCLUDES,
    });
  }

  static async findByUserId(userId: number) {
    return prisma.myFeature.findMany({
      where: { userId },
      include: DEFAULT_INCLUDES,
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(data: {
    userId: number;
    name: string;
    description: string;
  }) {
    return prisma.myFeature.create({
      data,
      include: DEFAULT_INCLUDES,
    });
  }

  static async update(id: number, data: Partial<{
    name: string;
    description: string;
  }>) {
    return prisma.myFeature.update({
      where: { id },
      data,
      include: DEFAULT_INCLUDES,
    });
  }

  static async delete(id: number) {
    return prisma.myFeature.delete({
      where: { id },
      include: DEFAULT_INCLUDES,
    });
  }
}
```

### Using Service in API Route

```typescript
// app/api/my-feature/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { MyFeatureService } from "@/lib/services/my-feature.service";
import { MyFeatureRepository } from "@/lib/repositories/my-feature.repository";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json(error("unauthorized"), { status: 401 });
  }

  try {
    const items = await MyFeatureRepository.findByUserId(me.id);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/my-feature error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to fetch items"),
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json(error("unauthorized"), { status: 401 });
  }

  try {
    const body = await req.json();

    const result = await MyFeatureService.create(me.id, {
      name: body.name,
      description: body.description,
    });

    if (!result.success) {
      return NextResponse.json(
        error(result.error!.code, result.error!.message),
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("POST /api/my-feature error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to create item"),
      { status: 500 }
    );
  }
}
```

---

## 🎯 Common Tasks

### Task 1: Adding a New Table with Pagination

```typescript
import {
  SimplePagination,
  LoadingSpinner,
  NoResultsState,
  ErrorState,
} from "@/components/shared";

export function MyNewTable() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Loading state
  if (isLoading) return <LoadingSpinner message="Loading data..." />;

  // Error state
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  // Empty state
  if (data.length === 0) return <NoResultsState />;

  return (
    <div>
      {/* Table content */}
      <table>
        {paginatedData.map(item => (
          <tr key={item.id}>
            {/* ... */}
          </tr>
        ))}
      </table>

      {/* Pagination */}
      <SimplePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Task 2: Adding an Approval Workflow

```typescript
import { useState } from "react";
import { ApprovalDialog, RejectDialog } from "@/components/shared";

export function MyApprovalComponent({ item }) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await fetch(`/api/items/${item.id}/approve`, {
        method: "POST",
      });
      toast.success("Approved successfully");
      setApproveOpen(false);
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await fetch(`/api/items/${item.id}/reject`, {
        method: "POST",
      });
      toast.success("Rejected successfully");
      setRejectOpen(false);
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button onClick={() => setApproveOpen(true)}>Approve</Button>
      <Button onClick={() => setRejectOpen(true)}>Reject</Button>

      <ApprovalDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onConfirm={handleApprove}
        leaveType={item.type}
        employeeName={item.userName}
        isLoading={isProcessing}
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        leaveType={item.type}
        employeeName={item.userName}
        isLoading={isProcessing}
      />
    </>
  );
}
```

### Task 3: Adding Filters to a List

```typescript
import {
  StatusFilter,
  LeaveTypeFilter,
  SearchWithClear,
} from "@/components/shared";
import { useState, useMemo } from "react";

export function MyFilteredList({ data }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "ALL" && item.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [data, search, statusFilter, typeFilter]);

  const hasFilters = search || statusFilter !== "ALL" || typeFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  };

  return (
    <div>
      <SearchWithClear
        searchValue={search}
        onSearchChange={setSearch}
        onClearFilters={clearFilters}
        hasActiveFilters={hasFilters}
      />

      <StatusFilter
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <LeaveTypeFilter
        selectedType={typeFilter}
        onTypeChange={setTypeFilter}
      />

      {/* Render filtered data */}
    </div>
  );
}
```

---

## 📂 File Organization

### Current Structure
```
lib/
  constants/
    leave-options.ts          # Leave types, status options
  services/
    leave.service.ts          # Business logic
    leave-validator.ts        # Validation logic
  repositories/
    leave.repository.ts       # Database operations

components/
  shared/
    filters/                  # Filter components
    modals/                   # Dialog components
    states/                   # Loading/empty states
    pagination/               # Pagination components

app/
  api/
    leaves/
      route.ts               # API endpoints
      route.refactored.ts    # Refactored example
```

### Where to Add New Files

| Type | Location | Example |
|------|----------|---------|
| New service | `lib/services/` | `approval.service.ts` |
| New repository | `lib/repositories/` | `approval.repository.ts` |
| New validator | `lib/services/` | `approval-validator.ts` |
| Shared component | `components/shared/` | `components/shared/approvals/` |
| API route | `app/api/` | `app/api/approvals/route.ts` |
| Constants | `lib/constants/` | `approval-options.ts` |

---

## ✅ Best Practices

### DO ✅

1. **Use shared components**
   ```typescript
   // ✅ Good
   <LoadingSpinner message="Loading..." />

   // ❌ Avoid
   <div className="animate-spin">...</div>
   ```

2. **Use service layer for business logic**
   ```typescript
   // ✅ Good
   const result = await LeaveService.createLeave(userId, data);

   // ❌ Avoid
   // 100 lines of business logic in API route
   ```

3. **Use repositories for database**
   ```typescript
   // ✅ Good
   const leaves = await LeaveRepository.findByUserId(userId);

   // ❌ Avoid
   const leaves = await prisma.leaveRequest.findMany({...});
   ```

4. **Use constants for options**
   ```typescript
   // ✅ Good
   import { LEAVE_TYPE_OPTIONS } from "@/lib/constants";

   // ❌ Avoid
   const options = [{ value: "EARNED", label: "Earned" }, ...];
   ```

5. **Handle errors gracefully**
   ```typescript
   // ✅ Good
   if (!result.success) {
     return <ErrorState message={result.error.message} />;
   }

   // ❌ Avoid
   // Let errors crash the app
   ```

### DON'T ❌

1. **Don't mix business logic in components**
2. **Don't duplicate code - use shared components**
3. **Don't put database queries in components**
4. **Don't create custom pagination - use shared**
5. **Don't skip validation - use validators**

---

## 🧪 Testing Guidelines

### Testing Shared Components

```typescript
// __tests__/components/shared/LoadingSpinner.test.tsx
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "@/components/shared";

describe("LoadingSpinner", () => {
  it("should render with default message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render with custom message", () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("should show spinning icon", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
```

### Testing Services

```typescript
// __tests__/services/leave.service.test.ts
import { LeaveService } from "@/lib/services/leave.service";
import { LeaveRepository } from "@/lib/repositories/leave.repository";

jest.mock("@/lib/repositories/leave.repository");

describe("LeaveService", () => {
  describe("createLeaveRequest", () => {
    it("should create leave request successfully", async () => {
      const mockLeave = { id: 1, type: "EARNED", status: "PENDING" };
      (LeaveRepository.create as jest.Mock).mockResolvedValue(mockLeave);

      const result = await LeaveService.createLeaveRequest(1, {
        type: "EARNED",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-05"),
        reason: "Vacation",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLeave);
    });

    it("should return error for invalid dates", async () => {
      const result = await LeaveService.createLeaveRequest(1, {
        type: "EARNED",
        startDate: new Date("2025-01-05"),
        endDate: new Date("2025-01-01"), // Invalid: end before start
        reason: "Vacation",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("invalid_date_range");
    });
  });
});
```

### Testing Repositories

```typescript
// __tests__/repositories/leave.repository.test.ts
import { LeaveRepository } from "@/lib/repositories/leave.repository";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    leaveRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("LeaveRepository", () => {
  it("should find leave by id", async () => {
    const mockLeave = { id: 1, type: "EARNED" };
    (prisma.leaveRequest.findUnique as jest.Mock).mockResolvedValue(mockLeave);

    const result = await LeaveRepository.findById(1);

    expect(result).toEqual(mockLeave);
    expect(prisma.leaveRequest.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: expect.any(Object),
    });
  });
});
```

---

## 🚀 Next Steps

### Immediate Tasks
1. Review this playbook
2. Try using shared components in a new feature
3. Write tests for critical paths
4. Add documentation for your specific domain logic

### When Adding Features
1. Check if shared components exist first
2. Follow service layer pattern
3. Use repositories for database
4. Add tests
5. Update this playbook with new patterns

### Maintenance
1. Keep shared components DRY
2. Refactor incrementally as you touch files
3. Document new patterns you create
4. Share knowledge with the team

---

## 📞 Support

### Questions?
- Check Phase 1-3 summary documents
- Review existing service implementations
- Ask team members who've used these patterns

### Found a Bug?
- Check if it's in shared components
- Fix once, benefits everywhere
- Add test to prevent regression

### Want to Contribute?
- Follow established patterns
- Keep components small and focused
- Document your additions here

---

**Happy Coding! 🎉**
