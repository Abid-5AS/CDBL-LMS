/**
 * Annotation Registry
 * Central repository of all code annotations for the developer annotation mode
 */

import type { Annotation } from "@/types/annotations";

/**
 * Registry of annotations for the CDBL-LMS application
 * Add new annotations here to document components, APIs, and workflows
 */
export const annotationRegistry: Annotation[] = [
  // Dashboard Components
  {
    id: "dept-head-pending-table",
    title: "Department Head Pending Approvals Table",
    description:
      "Displays leave requests pending approval by department heads. Includes filtering, pagination, and quick action buttons for approve/reject/forward/return actions.",
    type: "component",
    category: "ui-presentation",
    filePath: "components/dashboards/dept-head/sections/PendingTable.tsx",
    apiEndpoints: [
      "GET /api/manager/pending",
      "POST /api/approvals/[id]/decision",
    ],
    dbModels: ["LeaveRequest", "Approval", "User"],
    keyFunctions: [
      "useLeaveActions",
      "useLeaveDialogs",
      "usePendingRequests",
    ],
    workflow:
      "1. Fetch pending requests → 2. Display in filterable table → 3. User takes action → 4. Send to API → 5. Update UI with toast notification",
    dataFlow:
      "SWR fetches from /api/manager/pending → Data flows through table component → Action buttons trigger API calls → Optimistic UI updates",
    relatedFiles: [
      "components/dashboards/dept-head/hooks/useLeaveActions.ts",
      "components/dashboards/dept-head/hooks/useLeaveDialogs.ts",
    ],
    notes: [
      "Uses SWR for data fetching with automatic revalidation",
      "Implements optimistic UI updates for better UX",
      "Supports bulk actions and keyboard shortcuts",
    ],
    tags: ["approvals", "dept-head", "table", "leave-management"],
  },

  {
    id: "hr-admin-pending-approvals",
    title: "HR Admin Pending Leave Requests",
    description:
      "HR Admin view for managing all pending leave requests across the organization. Includes status tabs, search, and forwarding capabilities.",
    type: "component",
    category: "ui-presentation",
    filePath: "components/dashboards/hr-admin/sections/PendingApprovals.tsx",
    apiEndpoints: [
      "GET /api/approvals",
      "POST /api/approvals/[id]/decision",
    ],
    dbModels: ["LeaveRequest", "Approval", "User", "Department"],
    keyFunctions: [
      "usePendingRequests",
      "useLeaveFiltering",
      "handleSingleAction",
    ],
    workflow:
      "HR Admin reviews requests → Filters by status/type → Forwards to appropriate approver or returns to employee",
    dataFlow:
      "Fetches all org-wide requests → Filters client-side → Actions send to decision API → Revalidates data",
    relatedFiles: [
      "components/dashboards/hr-admin/hooks/useLeaveFiltering.ts",
      "components/dashboards/hr-admin/components/PendingLeaveCard.tsx",
    ],
    notes: [
      "Responsive design with table view (desktop) and card view (mobile)",
      "Status tabs for PENDING, RETURNED, and CANCELLED requests",
      "Real-time search across employee name, email, type, and reason",
    ],
    tags: ["hr-admin", "approvals", "organization-wide"],
  },

  {
    id: "leave-request-service",
    title: "Leave Request Service Layer",
    description:
      "Core business logic for leave request operations including creation, validation, approval workflows, and state transitions.",
    type: "service",
    category: "business-logic",
    filePath: "lib/services/LeaveRequestService.ts",
    apiEndpoints: [
      "POST /api/leaves",
      "PUT /api/leaves/[id]",
      "DELETE /api/leaves/[id]",
    ],
    dbModels: [
      "LeaveRequest",
      "Balance",
      "Approval",
      "Holiday",
      "PolicyConfig",
      "AuditLog",
    ],
    keyFunctions: [
      "createLeaveRequest",
      "calculateWorkingDays",
      "validateBalance",
      "initializeApprovalChain",
    ],
    workflow:
      "Validate eligibility → Check balance → Calculate working days → Create request → Initialize approval chain → Send notifications",
    dataFlow:
      "Request data → Validation layer → Business rules → Database transaction → Notification queue → Response",
    notes: [
      "Implements multi-stage approval workflow based on leave type",
      "Handles complex balance calculations and carryover rules",
      "Integrates with notification service for email alerts",
      "Maintains comprehensive audit trail",
    ],
    tags: ["service", "business-logic", "leave-request", "validation"],
  },

  {
    id: "approval-workflow",
    title: "Multi-Stage Approval Workflow",
    description:
      "Orchestrates the approval chain for leave requests through HR Admin → Dept Head → HR Head → CEO based on leave type and duration.",
    type: "workflow",
    category: "business-logic",
    filePath: "lib/workflow.ts",
    dbModels: ["Approval", "LeaveRequest", "User"],
    keyFunctions: ["getChainFor", "getNextApprover", "canUserApprove"],
    workflow:
      "Determine required approvers → Create approval records → Route to current approver → Track decisions → Advance to next stage",
    dataFlow:
      "Leave type + duration → Chain determination → Approval routing → Status updates → Final decision",
    relatedFiles: [
      "lib/services/ApprovalService.ts",
      "lib/repositories/ApprovalRepository.ts",
    ],
    notes: [
      "Different leave types require different approval chains",
      "Medical leaves >3 days require certificate upload",
      "Study/Maternity/Paternity leaves require CEO approval",
    ],
    tags: ["workflow", "approval", "routing", "permissions"],
  },

  {
    id: "api-manager-pending",
    title: "Manager Pending Requests API",
    description:
      "API endpoint that returns leave requests pending approval for the authenticated department head, with filtering and pagination.",
    type: "api",
    category: "api-integration",
    filePath: "app/api/manager/pending/route.ts",
    apiEndpoints: ["GET /api/manager/pending"],
    dbModels: ["LeaveRequest", "Approval", "User", "Department"],
    keyFunctions: ["getPendingForManager", "filterByStatus", "paginate"],
    workflow:
      "Authenticate user → Verify DEPT_HEAD role → Fetch pending approvals → Apply filters → Paginate → Return response",
    dataFlow:
      "Auth token → Role verification → Database query with joins → Filtering → Pagination → JSON response",
    notes: [
      "Requires DEPT_HEAD or higher role",
      "Supports query params: q (search), status, type, page, size",
      "Returns counts for status badges",
    ],
    tags: ["api", "dept-head", "approvals", "pagination"],
  },

  {
    id: "use-pending-requests",
    title: "usePendingRequests Hook",
    description:
      "Custom React hook for fetching and managing pending leave requests with built-in search, filtering, and action handlers.",
    type: "hook",
    category: "state-management",
    filePath: "components/dashboards/dept-head/hooks/usePendingRequests.ts",
    apiEndpoints: ["GET /api/manager/pending"],
    keyFunctions: ["useSWR", "handleSingleAction", "refresh"],
    dataFlow:
      "Component mount → SWR fetch → Cache → Component state → User action → Optimistic update → API call → Revalidate",
    relatedFiles: [
      "components/dashboards/dept-head/sections/PendingTable.tsx",
      "lib/apiClient.ts",
    ],
    notes: [
      "Uses SWR for automatic revalidation and caching",
      "Implements debounced search",
      "Provides loading and error states",
    ],
    tags: ["hook", "swr", "data-fetching", "state"],
  },

  {
    id: "balance-calculation",
    title: "Leave Balance Calculator",
    description:
      "Utility for calculating leave balances, accruals, carryovers, and remaining days based on policy configurations.",
    type: "utility",
    category: "business-logic",
    filePath: "lib/balance-calculator.ts",
    dbModels: ["Balance", "PolicyConfig", "LeaveRequest"],
    keyFunctions: [
      "calculateAccrual",
      "applyCarryover",
      "getRemainingDays",
      "canRequestLeave",
    ],
    workflow:
      "Fetch policy config → Calculate yearly accrual → Apply carryover rules → Subtract used days → Return available balance",
    notes: [
      "Handles different accrual rates per leave type",
      "Implements carryover limits (e.g., max 15 days for EARNED)",
      "Pro-rates for employees joining mid-year",
    ],
    tags: ["utility", "calculation", "balance", "policy"],
  },

  {
    id: "notification-service",
    title: "Email Notification Service",
    description:
      "Sends transactional emails for leave request actions including submissions, approvals, rejections, and reminders.",
    type: "service",
    category: "api-integration",
    filePath: "lib/services/NotificationService.ts",
    apiEndpoints: ["POST /api/notifications/send"],
    keyFunctions: [
      "sendLeaveSubmissionEmail",
      "sendApprovalNotification",
      "sendRejectionNotification",
    ],
    workflow:
      "Trigger event → Build email template → Queue email → Send via provider → Log delivery status",
    dataFlow:
      "Event data → Template engine → Email queue → SMTP/API → Delivery confirmation",
    relatedFiles: [
      "lib/email-templates/*.tsx",
      "lib/email-provider.ts",
    ],
    notes: [
      "Uses React Email for templating",
      "Supports both SMTP and API-based providers",
      "Implements retry logic for failed deliveries",
    ],
    tags: ["notification", "email", "service", "communication"],
  },
];

/**
 * Get annotation by ID
 */
export function getAnnotationById(id: string): Annotation | undefined {
  return annotationRegistry.find((a) => a.id === id);
}

/**
 * Get annotations by file path
 */
export function getAnnotationsByFile(filePath: string): Annotation[] {
  return annotationRegistry.filter((a) => a.filePath === filePath);
}

/**
 * Get annotations by type
 */
export function getAnnotationsByType(type: string): Annotation[] {
  return annotationRegistry.filter((a) => a.type === type);
}

/**
 * Get annotations by category
 */
export function getAnnotationsByCategory(category: string): Annotation[] {
  return annotationRegistry.filter((a) => a.category === category);
}

/**
 * Search annotations
 */
export function searchAnnotations(query: string): Annotation[] {
  const lowerQuery = query.toLowerCase();
  return annotationRegistry.filter(
    (a) =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.description.toLowerCase().includes(lowerQuery) ||
      a.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
